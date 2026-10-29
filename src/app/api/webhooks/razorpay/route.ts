import { NextResponse } from "next/server";

import {
  handleRazorpayWebhookEvent,
  verifyWebhookSignature,
  type RazorpayWebhookEvent,
} from "@/lib/billing/razorpay-server";
import { logServerError } from "@/lib/server/safe-action";

export const runtime = "nodejs";

/** Legacy path — forwards to the same handler as /api/payments/webhook */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return new NextResponse("Unauthorized Webhook Call", { status: 403 });
    }

    const eventData = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const result = await handleRazorpayWebhookEvent(eventData);

    if (!result.ok) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "processed", handled: result.handled });
  } catch (error) {
    logServerError("webhooks.razorpay", error);
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
