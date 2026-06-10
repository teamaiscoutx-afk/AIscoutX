import { NextResponse, type NextRequest } from "next/server";

import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

/**
 * Checkout entry — redirects to the Stripe Payment Link for Pro,
 * attaching client_reference_id so the webhook can provision automatically.
 * Set STRIPE_PRO_PAYMENT_LINK in env (e.g. https://buy.stripe.com/xxxx).
 */
export async function GET(request: NextRequest) {
  try {
    const paymentLink = process.env.STRIPE_PRO_PAYMENT_LINK;
    const origin = new URL(request.url).origin;

    if (!paymentLink) {
      return NextResponse.redirect(
        new URL("/dashboard/discover?billing=unconfigured", origin)
      );
    }

    const url = new URL(paymentLink);

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(
          new URL("/login?next=/dashboard/discover", origin)
        );
      }

      url.searchParams.set("client_reference_id", user.id);
      if (user.email) {
        url.searchParams.set("prefilled_email", user.email);
      }
    }

    return NextResponse.redirect(url);
  } catch (err) {
    logServerError("checkout.redirect", err);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(
      new URL("/dashboard/discover?billing=error", origin)
    );
  }
}
