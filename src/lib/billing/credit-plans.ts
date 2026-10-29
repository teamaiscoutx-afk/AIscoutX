export const MONTHLY_CREDIT_ALLOWANCE = 200;
export const TOPUP_CREDITS = 100;
export const TOPUP_PRICE_USD = 5;

export type CheckoutPlanId = "pro" | "monthly" | "six_month" | "annual" | "topup";

export type CatalogPlan = {
  id: Exclude<CheckoutPlanId, "pro">;
  name: string;
  priceLabel: string;
  period: string;
  creditsLabel: string;
  description: string;
  badge?: string;
  cta: string;
  featured?: boolean;
  amountCents: number;
  features: string[];
};

export const PRICING_PLANS: CatalogPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "$19",
    period: "/month",
    creditsLabel: "200 credits / month",
    description: "Stay in the workspace month to month.",
    cta: "Get Started",
    amountCents: 1900,
    features: [
      "200 credits refreshed every month",
      "Mentor workspace and live market updates",
      "Founder GPS and startup blueprints",
      "Cancel anytime",
    ],
  },
  {
    id: "six_month",
    name: "6-Month",
    priceLabel: "$59",
    period: "/6 months",
    creditsLabel: "1,200 total credits",
    description: "200 credits refresh automatically each month.",
    badge: "🔥 Most Popular / Best Value",
    cta: "Get Started",
    featured: true,
    amountCents: 5900,
    features: [
      "1,200 credits across 6 months",
      "200 credits auto-refreshed each month",
      "Everything in Monthly",
      "Lower cost than six separate months",
    ],
  },
  {
    id: "annual",
    name: "Founding Member",
    priceLabel: "$109",
    period: "/year",
    creditsLabel: "2,400 total credits",
    description: "200 credits refresh automatically each month.",
    badge: "🚀 Launch Deal - First 50 Founders Only",
    cta: "Become Founding Member",
    amountCents: 10900,
    features: [
      "2,400 credits across the year",
      "200 credits auto-refreshed each month",
      "Everything in the 6-Month plan",
      "Founding price locked for this launch",
    ],
  },
];

export const TOPUP_PLAN = {
  id: "topup" as const,
  name: "Extra credits",
  amountCents: TOPUP_PRICE_USD * 100,
  description: "$5 for 100 extra credits",
};

export function catalogAmount(plan: string): { amountCents: number; description: string } | null {
  if (plan === "topup") {
    return { amountCents: TOPUP_PLAN.amountCents, description: TOPUP_PLAN.description };
  }
  const match = PRICING_PLANS.find((item) => item.id === plan);
  if (!match) return null;
  return { amountCents: match.amountCents, description: `${match.name} — ${match.creditsLabel}` };
}
