import { NextRequest, NextResponse } from "next/server";

import { createRazorpayCheckoutOrder } from "@/lib/billing/razorpay-checkout.server";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";

/** @deprecated Prefer POST /api/payments/razorpay-checkout */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Auth is not configured." },
        { status: 503 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in to upgrade.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = typeof body?.plan === "string" ? body.plan : "pro";
    const checkout = await createRazorpayCheckoutOrder({ user, plan });

    return NextResponse.json({
      success: true,
      orderId: checkout.orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      description: checkout.description,
      prefill: checkout.prefill,
    });
  } catch (error) {
    logServerError("checkout.create", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/pricing", origin));
}
