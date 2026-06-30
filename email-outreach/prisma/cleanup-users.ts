/**
 * One-off cleanup: remove every registered user EXCEPT super admins.
 *
 * Deleting a Company cascades to its users and all workspace-scoped data
 * (campaigns, leads, SMTP accounts, billing, CRM, etc.). We delete campaigns
 * and templates first to avoid the CampaignStep.template `onDelete: Restrict`
 * cascade-ordering conflict in MySQL, then delete the companies, then sweep up
 * any remaining non-super-admin users (orphans or those sharing a kept company).
 *
 * Run:  npx tsx prisma/cleanup-users.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const dbUrlString = process.env.DATABASE_URL;
if (!dbUrlString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const dbUrl = new URL(dbUrlString);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || "3306"),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password || ""),
  database: dbUrl.pathname.replace(/^\//, ""),
  connectionLimit: 2,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Identify the super admins we must keep.
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, companyId: true },
  });

  if (superAdmins.length === 0) {
    throw new Error(
      "Aborting: no SUPER_ADMIN user found. Refusing to wipe the database without a super admin to keep."
    );
  }

  const keepCompanyIds = superAdmins
    .map((u) => u.companyId)
    .filter((id): id is string => !!id);

  console.log(`Keeping ${superAdmins.length} super admin(s):`);
  superAdmins.forEach((u) => console.log(`  - ${u.email}`));
  if (keepCompanyIds.length) {
    console.log(`Keeping ${keepCompanyIds.length} super-admin company(ies).`);
  }

  // 2. Target companies = everything not owned by a super admin.
  const targetCompanies = await prisma.company.findMany({
    where: keepCompanyIds.length ? { id: { notIn: keepCompanyIds } } : {},
    select: { id: true, name: true },
  });
  const targetCompanyIds = targetCompanies.map((c) => c.id);

  console.log(`\nWorkspaces to delete: ${targetCompanies.length}`);

  if (targetCompanyIds.length) {
    // 3. Delete campaigns first (cascades steps, queues, logs, events, leads, tags, notes).
    const campaigns = await prisma.campaign.deleteMany({
      where: { companyId: { in: targetCompanyIds } },
    });
    console.log(`  Deleted ${campaigns.count} campaign(s) and related data.`);

    // 4. Delete templates (now free of referencing campaign steps).
    const templates = await prisma.emailTemplate.deleteMany({
      where: { companyId: { in: targetCompanyIds } },
    });
    console.log(`  Deleted ${templates.count} email template(s).`);

    // 5. Delete the companies (cascades users + all remaining workspace data).
    const companies = await prisma.company.deleteMany({
      where: { id: { in: targetCompanyIds } },
    });
    console.log(`  Deleted ${companies.count} company(ies) and their users/data.`);
  }

  // 6. Sweep up any remaining non-super-admin users (orphans with no company,
  //    or users that shared a kept super-admin company).
  const leftoverUsers = await prisma.user.deleteMany({
    where: { role: { not: "SUPER_ADMIN" } },
  });
  console.log(`  Removed ${leftoverUsers.count} remaining non-super-admin user(s).`);

  // 7. Final verification.
  const remainingUsers = await prisma.user.findMany({
    select: { email: true, role: true },
  });
  console.log(`\nDone. ${remainingUsers.length} user(s) remain:`);
  remainingUsers.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
