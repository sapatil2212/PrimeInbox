import { redirect } from"next/navigation";
import { getSession } from"@/lib/session";
import { db } from"@/lib/db";
import { DashboardLayoutShell } from"@/components/layout/dashboard-layout-shell";

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const session = await getSession();

 if (!session) {
 redirect("/login");
 }

 // Retrieve full user and company details
 const user = await db.user.findUnique({
 where: { id: session.userId },
 select: {
 id: true,
 name: true,
 email: true,
 role: true,
 profileImage: true,
 timezone: true,
 language: true,
 company: {
 select: {
 id: true,
 name: true,
 workspaceSlug: true,
 subscriptionPlan: true,
 subscriptionStatus: true,
 },
 },
 },
 });

 if (!user) {
 redirect("/login");
 }

 // Handle users without complete profiles
 if (!user.timezone || !user.language) {
 redirect("/complete-profile");
 }

 const company = user.company || {
 id:"personal",
 name:"My Company",
 workspaceSlug:"personal",
 subscriptionPlan:"FREE",
 subscriptionStatus:"ACTIVE",
 };

 return (
 <DashboardLayoutShell user={user} company={company}>
 {children}
 </DashboardLayoutShell>
 );
}
