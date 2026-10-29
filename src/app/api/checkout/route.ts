import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

import {
  PRO_PRICE_AMOUNT_CENTS,
  PRO_CURRENCY,
} from "@/lib/billing/constants";
import { catalogAmount } from "@/lib/billing/credit-plans";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * POST /api/checkout — creates a Razorpay order for Pro ($12 USD / 1200 cents).
 */
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
    const priced =
      plan === "pro"
        ? { amountCents: PRO_PRICE_AMOUNT_CENTS, description: "AI Founder OS Pro Subscription" }
        : catalogAmount(plan);
    if (!priced) {
      return NextResponse.json(
        { success: false, error: "Unsupported plan." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: priced.amountCents,
      currency: PRO_CURRENCY,
      receipt: `${plan}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan,
        email: user.email ?? "",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: priced.amountCents,
      currency: PRO_CURRENCY,
      description: priced.description,
      prefill: {
        email: user.email ?? undefined,
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined),
      },
    });
  } catch (error) {
    logServerError("checkout.create", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** Legacy GET — redirect to discover billing flow. */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(
    new URL("/dashboard/discover?billing=checkout", origin)
  );
}
