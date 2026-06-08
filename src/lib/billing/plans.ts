export type BillingPlanId = "starter" | "pro" | "agency";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    period: "/month",
    description: "Essentials for getting started with opportunity intelligence.",
    features: [
      "Daily intelligence briefing",
      "5 tracked keywords",
      "Email alerts",
      "Basic workspace access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    period: "/month",
    description: "Full AI Founder OS pipeline for serious builders.",
    popular: true,
    features: [
      "Unlock 100+ Daily Exploding Signals",
      "Unlimited Deep Step-by-Step Execution Blueprints",
      "Custom AI Mentor Chat Access",
      "Advanced Validation & MVP Scoring Engine",
      "Unlimited workspace generation",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 99,
    period: "/month",
    description: "For power-builders executing multiple parallel ventures.",
    features: [
      "Everything in Pro",
      "Team workspace management",
      "Custom monitoring lanes",
      "White-label reports",
      "Dedicated support channel",
    ],
  },
];

/**
 * Stripe checkout entry point — wire to `/api/checkout` or Stripe Payment Links.
 */
export async function handleCheckout(planId: BillingPlanId): Promise<void> {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) return;

  // Production: replace with Stripe Checkout Session creation
  const checkoutUrl = `/api/checkout?plan=${planId}`;
  if (typeof window !== "undefined") {
    window.location.href = checkoutUrl;
  }
}
