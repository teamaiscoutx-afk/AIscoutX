import {
  PRO_MODAL_FEATURES,
  PRO_PRICE_DISPLAY,
  PRO_PRICE_INR,
  PRO_PRICE_LABEL,
} from "@/lib/billing/constants";

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
    price: PRO_PRICE_INR,
    priceLabel: PRO_PRICE_LABEL,
    period: "/month",
    description: "AI Founder OS — workspaces, GPS, and unlimited mentor chat.",
    popular: true,
    cta: "Proceed to Payment",
    features: [...PRO_MODAL_FEATURES],
  },
];

export { PRO_PRICE_DISPLAY };

export function getProPlan(): BillingPlan {
  return BILLING_PLANS.find((p) => p.id === "pro")!;
}

/** @deprecated Use `useRazorpayCheckout().startCheckout()` in client components. */
export function startProCheckout(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aiscoutx:start-pro-checkout"));
  }
}
