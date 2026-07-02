import crypto from "crypto";

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

  const payload = `${input.paymentId}|${input.orderId}`;
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

/** Upgrade authenticated user to Pro after verified payment. */
export async function provisionProSubscription(input: {
  userId: string;
  email?: string | null;
  razorpayOrderId?: string | null;
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
      stripe_customer_id: input.razorpayOrderId ?? undefined,
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
