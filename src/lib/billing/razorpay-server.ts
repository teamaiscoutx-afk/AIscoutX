import crypto from "crypto";

import { TOPUP_CREDITS } from "@/lib/billing/credit-plans";
import { addBonusCredits } from "@/lib/billing/credit-engine.server";
import { fetchOrderPlan } from "@/lib/billing/razorpay-checkout.server";
import { nextRenewalDate } from "@/lib/billing/subscription-alerts";
import { PRO_PRICE_DISPLAY } from "@/lib/billing/constants";
import { sendSubscriptionSuccessEmail } from "@/lib/email";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export function getRazorpayKeySecret(): string | null {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const payload = `${input.orderId}|${input.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(input.signature, "hex")
    );
  } catch {
    return expected === input.signature;
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signatureHeader, "hex")
    );
  } catch {
    return expected === signatureHeader;
  }
}

function tierFromPlanId(planId: string | null | undefined): "monthly" | "six_month" | "annual" | "free" {
  if (planId === "monthly") return "monthly";
  if (planId === "six_month") return "six_month";
  if (planId === "annual") return "annual";
  return "monthly";
}

function allowanceForTier(tier: "monthly" | "six_month" | "annual" | "free"): number {
  return 200;
}

function startingBalanceForTier(tier: "monthly" | "six_month" | "annual" | "free"): number {
  if (tier === "annual") return 2400;
  if (tier === "six_month") return 1200;
  if (tier === "monthly") return 200;
  return 200;
}

/** Upgrade authenticated user to Pro after verified payment. */
export async function provisionProSubscription(input: {
  userId: string;
  email?: string | null;
  razorpayOrderId?: string | null;
  catalogPlan?: string | null;
}): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    logServerError("razorpay.provision", "Service role client unavailable");
    return false;
  }

  const subscriptionTier = tierFromPlanId(input.catalogPlan);
  const monthlyAllowance = allowanceForTier(subscriptionTier);

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "pro",
      subscription_status: "active",
      subscription_tier: subscriptionTier,
      monthly_allowance: monthlyAllowance,
      credits_balance: startingBalanceForTier(subscriptionTier),
      buffer_used: false,
      stripe_customer_id: input.razorpayOrderId ?? undefined,
      subscription_renewal_at: nextRenewalDate(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) {
    logServerError("razorpay.provision", error);
    return false;
  }

  if (input.email) {
    await sendSubscriptionSuccessEmail(input.email, {
      amountLabel: PRO_PRICE_DISPLAY,
      orderId: input.razorpayOrderId,
    });
  }

  return true;
}

async function isOrderFulfilled(orderId: string): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("razorpay_fulfilled_orders")
    .select("order_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("pgrst205")) {
      return false;
    }
    logServerError("razorpay.orderLookup", error);
    return false;
  }

  return Boolean(data?.order_id);
}

async function markOrderFulfilled(
  orderId: string,
  userId: string,
  plan: string
): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("razorpay_fulfilled_orders").insert({
    order_id: orderId,
    user_id: userId,
    plan,
  });

  if (error) {
    if (error.code === "23505") return false;
    logServerError("razorpay.markOrder", error);
    return false;
  }

  return true;
}

/** Idempotent fulfillment for client verify + webhooks. */
export async function fulfillRazorpayPurchase(input: {
  orderId: string;
  userId?: string | null;
  email?: string | null;
  planHint?: string | null;
}): Promise<{ ok: boolean; plan?: string; error?: string }> {
  const fromOrder = await fetchOrderPlan(input.orderId);
  const userId = input.userId ?? fromOrder.userId;
  const plan = input.planHint ?? fromOrder.plan;
  const email = input.email ?? fromOrder.email;

  if (!userId) {
    return { ok: false, error: "Missing user id on order." };
  }

  if (await isOrderFulfilled(input.orderId)) {
    return { ok: true, plan, error: "already_fulfilled" };
  }

  if (plan === "topup") {
    const credited = await addBonusCredits(userId, TOPUP_CREDITS);
    if (!credited) {
      return { ok: false, error: "Top-up credit grant failed." };
    }
    await markOrderFulfilled(input.orderId, userId, plan);
    return { ok: true, plan: "topup" };
  }

  const provisioned = await provisionProSubscription({
    userId,
    email,
    razorpayOrderId: input.orderId,
    catalogPlan: plan,
  });

  if (!provisioned) {
    return { ok: false, error: "Subscription provisioning failed." };
  }

  await markOrderFulfilled(input.orderId, userId, plan);
  return { ok: true, plan };
}

export type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    order?: { entity?: Record<string, unknown> };
    subscription?: { entity?: Record<string, unknown> };
  };
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function handleRazorpayWebhookEvent(
  eventData: RazorpayWebhookEvent
): Promise<{ ok: boolean; handled: boolean }> {
  const event = eventData.event ?? "";

  const successEvents = new Set([
    "order.paid",
    "payment.captured",
    "subscription.charged",
    "subscription.activated",
  ]);

  if (successEvents.has(event)) {
    const payment = eventData.payload?.payment?.entity;
    const order = eventData.payload?.order?.entity;
    const subscription = eventData.payload?.subscription?.entity;

    const orderId =
      readString(payment?.order_id) ??
      readString(order?.id) ??
      readString(subscription?.id);

    if (!orderId) {
      logServerError("razorpay.webhook", "Missing order id in webhook payload");
      return { ok: false, handled: true };
    }

    const notes =
      (order?.notes as Record<string, unknown> | undefined) ??
      (payment?.notes as Record<string, unknown> | undefined) ??
      (subscription?.notes as Record<string, unknown> | undefined);

    const userId = readString(notes?.user_id);
    const plan = readString(notes?.plan);
    const email =
      readString(payment?.email) ??
      readString(notes?.email) ??
      readString(subscription?.customer_email);

    const result = await fulfillRazorpayPurchase({
      orderId,
      userId,
      email,
      planHint: plan,
    });

    if (!result.ok && result.error !== "already_fulfilled") {
      return { ok: false, handled: true };
    }

    if (email && result.ok && result.error !== "already_fulfilled") {
      await sendSubscriptionSuccessEmail(email, {
        amountLabel: PRO_PRICE_DISPLAY,
        orderId,
      }).catch(() => undefined);
    }

    return { ok: true, handled: true };
  }

  const cancelEvents = new Set([
    "subscription.cancelled",
    "subscription.halted",
    "subscription.completed",
  ]);

  if (cancelEvents.has(event)) {
    const sub = eventData.payload?.subscription?.entity;
    const email =
      readString(sub?.email) ??
      readString((sub?.notes as Record<string, unknown> | undefined)?.email);

    if (email) {
      const supabase = createServiceRoleSupabaseClient();
      if (supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .maybeSingle();
        if (profile?.id) {
          await cancelProSubscription(profile.id);
        }
      }
    }
    return { ok: true, handled: true };
  }

  return { ok: true, handled: false };
}

export async function cancelProSubscription(userId: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "canceled",
      subscription_renewal_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
