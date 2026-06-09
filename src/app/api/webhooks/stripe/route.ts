import { NextResponse } from "next/server";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Stripe webhook — activates Starter plan on successful checkout.
 * Set STRIPE_WEBHOOK_SECRET and wire checkout.session.completed events.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true });
  }

  try {
    const payload = await request.json();
    const eventType = payload?.type as string | undefined;
    const userId =
      payload?.data?.object?.client_reference_id ??
      payload?.data?.object?.metadata?.user_id;

    if (eventType === "checkout.session.completed" && userId) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("profiles")
        .update({ plan: "starter", updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
