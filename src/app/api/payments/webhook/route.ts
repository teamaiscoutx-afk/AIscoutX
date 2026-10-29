import { NextResponse } from "next/server";

import {
  handleRazorpayWebhookEvent,
  verifyWebhookSignature,
  type RazorpayWebhookEvent,
} from "@/lib/billing/razorpay-server";
import { logServerError } from "@/lib/server/safe-action";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook — Razorpay webhook (order.paid, subscription.charged, …)
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return new NextResponse("Invalid webhook signature", { status: 403 });
    }

    const eventData = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const result = await handleRazorpayWebhookEvent(eventData);

    if (!result.ok) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, handled: result.handled });
  } catch (err) {
    logServerError("payments.webhook", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
