import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <AdminLayoutShell user={user}>
      {children}
    </AdminLayoutShell>
  );
}
