import { db } from "./config/db";

async function findUsers() {
  const users = await db.user.findMany({
    where: {
      companyId: { not: null }
    },
    include: {
      company: true
    },
    take: 5
  });

  console.log("🔍 Registered Tenant Users:");
  users.forEach((u) => {
    console.log(`- Email: ${u.email} | Company: ${u.company?.name} (ID: ${u.companyId}) | Role: ${u.role}`);
  });
}

findUsers();
