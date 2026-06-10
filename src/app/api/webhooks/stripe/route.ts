import crypto from "crypto";

import { NextResponse } from "next/server";

import { sendSubscriptionSuccessEmail } from "@/lib/email";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Stripe webhook — automatic Pro provisioning.
 * Handles checkout.session.completed, customer.subscription.updated,
 * and customer.subscription.deleted. Verifies the Stripe-Signature header
 * when STRIPE_WEBHOOK_SECRET is set.
 */

function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  const parts = new Map(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, v] as const;
    })
  );

  const timestamp = parts.get("t");
  const expected = parts.get("v1");
  if (!timestamp || !expected) return false;

  // Reject events older than 5 minutes (replay protection)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isNaN(age) || age > 300) return false;

  const signed = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signed, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

type StripeObject = {
  client_reference_id?: string | null;
  customer?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  status?: string | null;
  metadata?: { user_id?: string } | null;
};

async function resolveUserId(
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  obj: StripeObject
): Promise<{ userId: string | null; email: string | null }> {
  const directId = obj.client_reference_id ?? obj.metadata?.user_id ?? null;
  const email = obj.customer_email ?? obj.customer_details?.email ?? null;

  if (directId) {
    return { userId: directId, email };
  }

  if (obj.customer) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("stripe_customer_id", obj.customer)
      .maybeSingle();
    if (data) return { userId: data.id, email: data.email ?? email };
  }

  if (email) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (data) return { userId: data.id, email };
  }

  return { userId: null, email };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret) {
      const valid = verifyStripeSignature(
        rawBody,
        request.headers.get("stripe-signature"),
        secret
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceRoleSupabaseClient();
    if (!supabase) {
      // Acknowledge so Stripe doesn't retry forever; provisioning needs service role.
      logServerError("stripe.webhook", "Service role client unavailable");
      return NextResponse.json({ received: true });
    }

    let event: { type?: string; data?: { object?: StripeObject } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventType = event.type ?? "";
    const obj = event.data?.object ?? {};

    if (eventType === "checkout.session.completed") {
      const { userId, email } = await resolveUserId(supabase, obj);
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            plan: "pro",
            subscription_status: "active",
            stripe_customer_id: obj.customer ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (email) {
          await sendSubscriptionSuccessEmail(email);
        }
      } else {
        logServerError(
          "stripe.webhook",
          "checkout.session.completed without resolvable user"
        );
      }
    }

    if (eventType === "customer.subscription.updated") {
      const { userId } = await resolveUserId(supabase, obj);
      if (userId) {
        const active = obj.status === "active" || obj.status === "trialing";
        await supabase
          .from("profiles")
          .update({
            plan: active ? "pro" : "free",
            subscription_status: active ? "active" : "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    }

    if (eventType === "customer.subscription.deleted") {
      const { userId } = await resolveUserId(supabase, obj);
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logServerError("stripe.webhook", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
