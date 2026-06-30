export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  name: string;
  /** Monthly price in INR (rupees). 0 means a free plan. */
  price: number;
  /** Amount in paise for Razorpay (price * 100). */
  amountPaise: number;
  emails: string;
  smtp: string;
  /** Hard limit: emails sendable per calendar month. */
  emailsPerMonth: number;
  /** Hard limit: max SMTP sender accounts. */
  smtpLimit: number;
  /** Whether the drag-and-drop visual template builder is available. */
  visualBuilder: boolean;
  /** Marks a free, non-payable tier (skips the payment gateway). */
  free?: boolean;
  features: (string | PlanFeature)[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "BRONZE",
    name: "Bronze",
    price: 0,
    amountPaise: 0,
    emails: "10 emails total",
    smtp: "1 SMTP sender domain",
    emailsPerMonth: 10,
    smtpLimit: 1,
    visualBuilder: false,
    free: true,
    features: [
      "10 emails total",
      "1 SMTP sender domain",
      { text: "HTML Based Email Generator", included: false },
      { text: "Basic Conversion Analytics", included: false },
      { text: "Community Slack Support", included: false },
    ],
  },
  {
    id: "SILVER",
    name: "Silver",
    price: 499,
    amountPaise: 499 * 100,
    emails: "20,000 emails/month",
    smtp: "Up to 2 SMTP sender domains",
    emailsPerMonth: 20000,
    smtpLimit: 2,
    visualBuilder: false,
    features: [
      "20,000 emails/month",
      "Up to 2 SMTP sender domains",
      "HTML Based Email Generator",
      "Basic Conversion Analytics",
      "Community Slack Support",
    ],
  },
  {
    id: "GOLD",
    name: "Gold",
    price: 999,
    amountPaise: 999 * 100,
    emails: "100,000 emails/month",
    smtp: "Up to 5 SMTP sender domains",
    emailsPerMonth: 100000,
    smtpLimit: 5,
    visualBuilder: true,
    popular: true,
    features: [
      "100,000 emails/month",
      "Up to 5 SMTP sender domains",
      "Advanced Sentiment Analytics",
      "AI Based Email Builder",
      "Priority Discord & Support",
    ],
  },
  {
    id: "PLATINUM",
    name: "Platinum",
    price: 1999,
    amountPaise: 1999 * 100,
    emails: "250,000 emails/month",
    smtp: "Up to 10 SMTP sender domains",
    emailsPerMonth: 250000,
    smtpLimit: 10,
    visualBuilder: true,
    features: [
      "250,000 emails/month",
      "Up to 10 SMTP sender domains",
      "Advanced Sentiment Analytics",
      "AI Based Email Builder",
      "Priority Discord & Support",
    ],
  },
];

export const PLAN_MAP: Record<string, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export const TRIAL_DAYS = 14;

export function getPlan(id: string | null | undefined): Plan | undefined {
  return id ? PLAN_MAP[id] : undefined;
}

export interface PlanLimits {
  emailsPerMonth: number;
  smtpLimit: number;
  visualBuilder: boolean;
}

/** Returns the limits for a plan id, falling back to the Silver tier for unknown/legacy plans. */
export function getPlanLimits(id: string | null | undefined): PlanLimits {
  const p = getPlan(id);
  if (p) return { emailsPerMonth: p.emailsPerMonth, smtpLimit: p.smtpLimit, visualBuilder: p.visualBuilder };
  return { emailsPerMonth: 20000, smtpLimit: 2, visualBuilder: false };
}
