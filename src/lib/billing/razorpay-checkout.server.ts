import Razorpay from "razorpay";
import type { User } from "@supabase/supabase-js";

import {
  PRO_CURRENCY,
  PRO_PRICE_AMOUNT_CENTS,
} from "@/lib/billing/constants";
import { catalogAmount } from "@/lib/billing/credit-plans";
import { logServerError } from "@/lib/server/safe-action";

export type CheckoutCurrency = "USD" | "INR";

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getCheckoutCurrency(): CheckoutCurrency {
  const raw = process.env.RAZORPAY_CURRENCY?.trim().toUpperCase();
  return raw === "INR" ? "INR" : "USD";
}

/** Converts catalog USD cents to Razorpay `amount` (USD cents or INR paise). */
export function toRazorpayAmount(usdCents: number): number {
  if (getCheckoutCurrency() === "INR") {
    const rate = Number(process.env.RAZORPAY_USD_INR_RATE ?? "83");
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid RAZORPAY_USD_INR_RATE.");
    }
    return Math.round((usdCents / 100) * rate * 100);
  }
  return usdCents;
}

export function resolvePlanPricing(plan: string): {
  amountCents: number;
  description: string;
  currency: CheckoutCurrency;
} | null {
  const priced =
    plan === "pro"
      ? {
          amountCents: PRO_PRICE_AMOUNT_CENTS,
          description: "AI Founder OS Pro Subscription",
        }
      : catalogAmount(plan);

  if (!priced) return null;

  const currency = getCheckoutCurrency();
  return {
    amountCents: toRazorpayAmount(priced.amountCents),
    description: priced.description,
    currency,
  };
}

export function buildCheckoutPrefill(user: User): { email?: string; name?: string } {
  return {
    email: user.email ?? undefined,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      undefined,
  };
}

export async function createRazorpayCheckoutOrder(input: {
  user: User;
  plan: string;
}): Promise<{
  orderId: string;
  amount: number;
  currency: CheckoutCurrency;
  description: string;
  prefill: { email?: string; name?: string };
}> {
  const priced = resolvePlanPricing(input.plan);
  if (!priced) {
    throw new Error("Unsupported plan.");
  }

  const currency = priced.currency;
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: priced.amountCents,
    currency: currency === "INR" ? "INR" : PRO_CURRENCY,
    receipt: `${input.plan}_${input.user.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      user_id: input.user.id,
      plan: input.plan,
      email: input.user.email ?? "",
    },
  });

  return {
    orderId: order.id,
    amount: priced.amountCents,
    currency,
    description: priced.description,
    prefill: buildCheckoutPrefill(input.user),
  };
}

export async function fetchOrderPlan(orderId: string): Promise<{
  userId: string | null;
  plan: string;
  email: string | null;
}> {
  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.fetch(orderId);
    const notes = order.notes ?? {};
    const userId =
      typeof notes.user_id === "string" && notes.user_id.length > 0
        ? notes.user_id
        : null;
    const plan =
      typeof notes.plan === "string" && notes.plan.length > 0 ? notes.plan : "pro";
    const email =
      typeof notes.email === "string" && notes.email.length > 0 ? notes.email : null;
    return { userId, plan, email };
  } catch (err) {
    logServerError("razorpay.fetchOrder", err);
    return { userId: null, plan: "pro", email: null };
  }
}
