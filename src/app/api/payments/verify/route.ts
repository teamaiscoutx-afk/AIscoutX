import { NextResponse } from "next/server";

import {
  provisionProSubscription,
  verifyPaymentSignature,
} from "@/lib/billing/razorpay-server";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";

type VerifyBody = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

/**
 * POST /api/payments/verify — verifies Razorpay signature and upgrades to Pro.
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Auth is not configured." },
        { status: 503 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as VerifyBody;
    const paymentId = body.razorpay_payment_id?.trim();
    const orderId = body.razorpay_order_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { ok: false, error: "Incomplete payment verification payload." },
        { status: 400 }
      );
    }

    const valid = verifyPaymentSignature({ paymentId, orderId, signature });
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const provisioned = await provisionProSubscription({
      userId: user.id,
      email: user.email,
      razorpayOrderId: orderId,
    });

    if (!provisioned) {
      return NextResponse.json(
        { ok: false, error: "Payment verified but provisioning failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, plan: "pro" });
  } catch (err) {
    logServerError("payments.verify", err);
    return NextResponse.json(
      { ok: false, error: "Verification failed." },
      { status: 500 }
    );
  }
}
