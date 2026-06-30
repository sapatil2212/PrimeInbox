import { db } from "@/lib/db";

export interface TrialState {
  /** True when access should be blocked (workspace not yet activated). */
  blocked: boolean;
  /** Deprecated: trials have been removed. Always false. */
  onTrial: boolean;
  /** True when the workspace is awaiting manual activation by an admin. */
  pendingActivation: boolean;
  /** True when subscription is a paid/free active plan. */
  isPaid: boolean;
  /** Deprecated: trials have been removed. Always 0. */
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
 * Computes the subscription access state for a company.
 *
 * Trials have been removed. Access rules:
 *  - status "ACTIVE" => active workspace (paid or free Bronze), full access.
 *  - status "PENDING_ACTIVATION" => paid signup awaiting admin activation, blocked.
 *  - any other non-active status (SUSPENDED, EXPIRED, legacy TRIALING) => blocked.
 *  - legacy companies with no explicit status default to ACTIVE at the DB level.
 */
export function getTrialState(company: CompanyBillingFields): TrialState {
  const status = company.subscriptionStatus;
  const isPaid = status === "ACTIVE";
  const pendingActivation = status === "PENDING_ACTIVATION";
  const blocked = !isPaid;

  return {
    blocked,
    onTrial: false,
    pendingActivation,
    isPaid,
    daysLeft: 0,
    status,
    plan: company.subscriptionPlan,
    trialEndsAt: company.trialEndsAt ? new Date(company.trialEndsAt) : null,
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
