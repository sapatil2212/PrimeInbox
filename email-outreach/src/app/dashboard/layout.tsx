import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { DashboardLayoutShell } from "@/components/layout/dashboard-layout-shell";
import { getTrialState } from "@/lib/access";
import { TrialEnded } from "@/components/billing/trial-ended";

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const session = await getSession();

 if (!session) {
 redirect("/login");
 }

 // Retrieve full user and company details.
 // Wrapped in try/catch to handle stale sessions (e.g. deleted user, schema mismatch).
 let user;
 try {
 user = await db.user.findUnique({
  where: { id: session.userId },
  select: {
   id: true,
   name: true,
   email: true,
   role: true,
   profileImage: true,
   timezone: true,
   language: true,
   contactNo: true,
   company: {
    select: {
     id: true,
     name: true,
     workspaceSlug: true,
     subscriptionPlan: true,
     subscriptionStatus: true,
     trialEndsAt: true,
    },
   },
  },
 });
 } catch {
  // DB query failed — clear stale session via route handler and redirect to login
  redirect("/api/auth/clear-session");
 }

 if (!user) {
  // User no longer exists in the database — clear stale session via route handler
  redirect("/api/auth/clear-session");
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
 trialEndsAt: null,
 };

 // Enforce trial / subscription access. Super admins are exempt.
 const trial = getTrialState({
 subscriptionStatus: company.subscriptionStatus,
 subscriptionPlan: company.subscriptionPlan,
 trialEndsAt: (company as any).trialEndsAt ?? null,
 });

 if (trial.blocked && user.role !== "SUPER_ADMIN") {
 return (
 <TrialEnded
 currentPlan={company.subscriptionPlan}
 prefill={{ name: user.name, email: user.email, contact: user.contactNo || undefined }}
 />
 );
 }

 return (
 <DashboardLayoutShell user={user} company={company} trial={{ onTrial: trial.onTrial, daysLeft: trial.daysLeft }}>
 {children}
 </DashboardLayoutShell>
 );
}
