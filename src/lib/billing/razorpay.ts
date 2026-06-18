import crypto from "crypto";

import { sendSubscriptionSuccessEmail } from "@/lib/email";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export type RazorpayCheckoutMode = "subscription" | "order";

export type RazorpayCheckoutSession = {
  mode: RazorpayCheckoutMode;
  keyId: string;
  subscriptionId?: string;
  orderId?: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
  notes?: Record<string, string>;
};

function getKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

function getKeySecret(): string | null {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getKeyId() && getKeySecret());
}

export function getRazorpayProAmount(): number {
  const raw = process.env.RAZORPAY_PRO_AMOUNT?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  // Default: $19/month in cents
  return 19 * 100;
}

export function getRazorpayCurrency(): string {
  return process.env.RAZORPAY_CURRENCY?.trim().toUpperCase() || "USD";
}

function basicAuthHeader(): string {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json()) as T & { error?: { description?: string } };
  if (!res.ok) {
    const message =
      payload?.error?.description ?? `Razorpay API error (${res.status})`;
    throw new Error(message);
  }
  return payload;
}

type RazorpaySubscription = { id: string };
type RazorpayOrder = { id: string; amount: number; currency: string };

export async function createProCheckoutSession(input: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<RazorpayCheckoutSession> {
  const keyId = getKeyId();
  if (!keyId) {
    throw new Error("Razorpay is not configured.");
  }

  const currency = getRazorpayCurrency();
  const planId = process.env.RAZORPAY_PRO_PLAN_ID?.trim();
  const notes = { user_id: input.userId, plan: "pro" };
  const prefill = {
    email: input.email ?? undefined,
    name: input.name ?? undefined,
  };

  if (planId) {
    const subscription = await razorpayPost<RazorpaySubscription>("/subscriptions", {
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes,
    });

    return {
      mode: "subscription",
      keyId,
      subscriptionId: subscription.id,
      currency,
      name: "AIscoutX Pro",
      description: "Unlimited blueprints, exports, Founder GPS, and AI chat.",
      prefill,
      notes,
    };
  }

  const amount = getRazorpayProAmount();
  const order = await razorpayPost<RazorpayOrder>("/orders", {
    amount,
    currency,
    receipt: `pro_${input.userId.slice(0, 8)}_${Date.now()}`,
    notes,
  });

  return {
    mode: "order",
    keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: "AIscoutX Pro",
    description: "Pro plan — unlimited blueprints, exports, and founder ops.",
    prefill,
    notes,
  };
}

export function verifyPaymentSignature(input: {
  orderId?: string | null;
  subscriptionId?: string | null;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getKeySecret();
  if (!secret) return false;

  const payload = input.subscriptionId
    ? `${input.paymentId}|${input.subscriptionId}`
    : `${input.paymentId}|${input.orderId ?? ""}`;

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

/** Upgrade profile to Pro after verified payment. */
export async function provisionProSubscription(input: {
  userId: string;
  email?: string | null;
  razorpayCustomerId?: string | null;
}): Promise<boolean> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    logServerError("razorpay.provision", "Service role client unavailable");
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "pro",
      subscription_status: "active",
      stripe_customer_id: input.razorpayCustomerId ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) {
    logServerError("razorpay.provision", error);
    return false;
  }

  if (input.email) {
    await sendSubscriptionSuccessEmail(input.email);
  }

  return true;
}

export async function cancelProSubscription(userId: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function resolveUserIdFromNotes(
  notes?: Record<string, string> | null
): Promise<string | null> {
  const direct = notes?.user_id?.trim();
  return direct || null;
}
