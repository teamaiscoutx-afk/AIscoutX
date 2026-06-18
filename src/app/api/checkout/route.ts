import { NextResponse, type NextRequest } from "next/server";

import {
  createProCheckoutSession,
  isRazorpayConfigured,
} from "@/lib/billing/razorpay";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * POST /api/checkout — creates a Razorpay subscription or order and returns
 * checkout options for the client-side Razorpay modal.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.",
        },
        { status: 503 }
      );
    }

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
        { ok: false, error: "Sign in to upgrade.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = typeof body?.plan === "string" ? body.plan : "pro";
    if (plan !== "pro") {
      return NextResponse.json(
        { ok: false, error: "Unsupported plan." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const session = await createProCheckoutSession({
      userId: user.id,
      email: user.email ?? profile?.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      checkout: session,
    });
  } catch (err) {
    logServerError("checkout.create", err);
    const message =
      err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Legacy GET redirect — forwards to discover with a hint to use in-app checkout. */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  if (!isRazorpayConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/discover?billing=unconfigured", origin)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/discover?billing=checkout", origin)
  );
}
