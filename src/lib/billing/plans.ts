export type BillingPlanId = "free" | "pro";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  price: number;
  priceLabel: string;
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
    priceLabel: "Free",
    period: "/forever",
    description: "Full discovery + 3 blueprint runs every month.",
    cta: "You're on this plan",
    features: [
      "Live intelligence feed + niche switching",
      "3 blueprint generations per month",
      "Analyze, Blueprint & Launch modules",
      "10 AI founder chat messages",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    priceLabel: "$19",
    period: "/month",
    description: "Unlimited runs, exports, and founder ops.",
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      "Unlimited blueprint generation",
      "1-Click PDF export",
      "Founder GPS progress engine",
      "Unlimited projects + Trash recovery",
      "Unlimited AI Founder Chat",
    ],
  },
];

export function getProPlan(): BillingPlan {
  return BILLING_PLANS.find((p) => p.id === "pro")!;
}

/** @deprecated Use `useRazorpayCheckout().startCheckout()` in client components. */
export function startProCheckout(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aiscoutx:start-pro-checkout"));
  }
}
