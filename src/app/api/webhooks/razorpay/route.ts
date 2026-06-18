import { NextResponse } from "next/server";

import {
  cancelProSubscription,
  provisionProSubscription,
  resolveUserIdFromNotes,
  verifyWebhookSignature,
} from "@/lib/billing/razorpay";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        email?: string;
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
    const subscription = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;

    const activateEvents = new Set([
      "subscription.activated",
      "subscription.charged",
      "subscription.resumed",
      "payment.captured",
    ]);

    const cancelEvents = new Set([
      "subscription.cancelled",
      "subscription.completed",
      "subscription.halted",
    ]);

    if (activateEvents.has(eventType)) {
      const notes = subscription?.notes ?? payment?.notes;
      const userId = await resolveUserIdFromNotes(notes);
      if (userId) {
        await provisionProSubscription({
          userId,
          email: payment?.email ?? null,
          razorpayCustomerId: subscription?.id ?? null,
        });
      } else {
        logServerError(
          "razorpay.webhook",
          `${eventType} without resolvable user_id in notes`
        );
      }
    }

    if (cancelEvents.has(eventType)) {
      const userId = await resolveUserIdFromNotes(subscription?.notes);
      if (userId) {
        await cancelProSubscription(userId);
      }
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
