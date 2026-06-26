import { db } from "./config/db";

async function linkSuperAdmin() {
  const superAdminEmail = "contact.primeinbox@gmail.com";
  
  // Find first company
  const company = await db.company.findFirst();
  if (!company) {
    console.error("No companies found in database.");
    return;
  }

  await db.user.update({
    where: { email: superAdminEmail },
    data: {
      companyId: company.id
    }
  });

  console.log(`✅ Linked user ${superAdminEmail} to company: ${company.name} (ID: ${company.id})`);
}

linkSuperAdmin();
