export type BillingPlanId = "free" | "pro";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  cta: string;
  features: string[];
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Freemium",
    price: 0,
    period: "/forever",
    description: "Scout the market. See what the engine finds.",
    cta: "You're on this plan",
    features: [
      "Dashboard search",
      "5 opportunity views per day",
      "Trending keywords feed",
      "Save up to 5 signals",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    period: "/month",
    description: "Build with the full engine. No limits, no waiting.",
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      "Unlimited Generate Blueprint runs",
      "Deep Dive specs with cited market gaps",
      "Founder GPS progress engine",
      "Unlimited AI Founder Chat",
      "Priority niche alerts to your inbox",
    ],
  },
];

export function getProPlan(): BillingPlan {
  return BILLING_PLANS.find((p) => p.id === "pro")!;
}

/** Send the user to Stripe checkout (payment link via /api/checkout). */
export function startProCheckout(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/api/checkout?plan=pro";
  }
}
