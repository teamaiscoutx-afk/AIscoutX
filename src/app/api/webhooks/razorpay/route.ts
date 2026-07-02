import { NextResponse } from "next/server";

import {
  cancelProSubscription,
  provisionProSubscription,
  verifyWebhookSignature,
} from "@/lib/billing/razorpay-server";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        email?: string;
        notes?: Record<string, string>;
      };
    };
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

    if (webhookSecret) {
      const valid = verifyWebhookSignature(
        rawBody,
        request.headers.get("x-razorpay-signature")
      );
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const supabase = createServiceRoleSupabaseClient();
    if (!supabase) {
      logServerError("razorpay.webhook", "Service role client unavailable");
      return NextResponse.json({ received: true });
    }

    let event: RazorpayWebhookPayload;
    try {
      event = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventType = event.event ?? "";
    const payment = event.payload?.payment?.entity;
    const subscription = event.payload?.subscription?.entity;
    const notes = payment?.notes ?? subscription?.notes;
    const userId = notes?.user_id?.trim();

    const activateEvents = new Set([
      "payment.captured",
      "subscription.activated",
      "subscription.charged",
    ]);

    const cancelEvents = new Set([
      "subscription.cancelled",
      "subscription.completed",
      "subscription.halted",
    ]);

    if (activateEvents.has(eventType) && userId) {
      await provisionProSubscription({
        userId,
        email: payment?.email ?? notes?.email ?? null,
        razorpayOrderId: payment?.order_id ?? subscription?.id ?? null,
      });
    } else if (activateEvents.has(eventType) && !userId) {
      logServerError("razorpay.webhook", `${eventType} missing user_id in notes`);
    }

    if (cancelEvents.has(eventType) && userId) {
      await cancelProSubscription(userId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logServerError("razorpay.webhook", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
