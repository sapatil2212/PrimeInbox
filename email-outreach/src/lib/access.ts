import { db } from "@/lib/db";

export interface TrialState {
  /** True when access should be blocked (trial expired and not on a paid plan). */
  blocked: boolean;
  /** True while still within an active trial window. */
  onTrial: boolean;
  /** True when subscription is a paid, active plan. */
  isPaid: boolean;
  /** Whole days remaining in the trial (0 if none/expired). */
  daysLeft: number;
  status: string;
  plan: string;
  trialEndsAt: Date | null;
}

export interface CompanyBillingFields {
  subscriptionStatus: string;
  subscriptionPlan: string;
  trialEndsAt: Date | null;
}

/**
 * Computes the trial/subscription access state for a company.
 *
 * Rules:
 *  - status "ACTIVE" => paid, full access.
 *  - status "TRIALING" with trialEndsAt in the future => trial access.
 *  - not paid and trialEndsAt in the past => blocked.
 *  - legacy companies with no trialEndsAt and non-ACTIVE status are NOT blocked
 *    (avoids locking out pre-existing accounts).
 */
export function getTrialState(company: CompanyBillingFields): TrialState {
  const now = Date.now();
  const status = company.subscriptionStatus;
  const isPaid = status === "ACTIVE";
  const trialEnd = company.trialEndsAt ? new Date(company.trialEndsAt) : null;
  const trialMs = trialEnd ? trialEnd.getTime() : null;

  const onTrial = !isPaid && trialMs !== null && trialMs > now;
  const blocked = !isPaid && trialMs !== null && trialMs <= now;
  const daysLeft = trialMs ? Math.max(0, Math.ceil((trialMs - now) / (24 * 60 * 60 * 1000))) : 0;

  return {
    blocked,
    onTrial,
    isPaid,
    daysLeft,
    status,
    plan: company.subscriptionPlan,
    trialEndsAt: trialEnd,
  };
}

/** Fetches a company's billing fields and returns its trial state. */
export async function getCompanyTrialState(companyId: string): Promise<TrialState | null> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { subscriptionStatus: true, subscriptionPlan: true, trialEndsAt: true },
  });
  if (!company) return null;
  return getTrialState(company);
}
