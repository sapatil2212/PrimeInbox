import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const dbUrlString = process.env.DATABASE_URL;
if (!dbUrlString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const dbUrl = new URL(dbUrlString);
const host = dbUrl.hostname;
const port = parseInt(dbUrl.port || "3306");
const user = dbUrl.username;
const password = decodeURIComponent(dbUrl.password || "");
const database = dbUrl.pathname.replace(/^\//, "");

const adapter = new PrismaMariaDb({
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 2,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
  
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "contact.primeinbox@gmail.com";
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "primeinbox@2026";
  
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);
  
  const user = await prisma.user.upsert({
    where: { email: superAdminEmail.toLowerCase() },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
    create: {
      name: "Super Admin",
      email: superAdminEmail.toLowerCase(),
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
  });
  
  console.log(`Super Admin user seeded: ${user.email} (ID: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
