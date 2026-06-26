import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The admin area is gated by a DEDICATED admin session cookie that is only
  // issued through the Super Admin login portal. A regular user session —
  // even one with the SUPER_ADMIN role — cannot access this area.
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/superadmin/login");
  }

  // Re-validate against the database to ensure the account still exists and
  // is still a SUPER_ADMIN (defense in depth).
  const user = await db.user.findUnique({
    where: { id: admin.userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
    },
  });

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/superadmin/login");
  }

  return (
    <AdminLayoutShell user={user}>
      {children}
    </AdminLayoutShell>
  );
}
