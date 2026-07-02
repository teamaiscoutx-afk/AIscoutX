"use server";

import {
  buildRenewalAlert,
  syncSubscriptionRenewalReminder,
  type SubscriptionRenewalAlert,
} from "@/lib/billing/subscription-alerts";
import { friendlyError } from "@/lib/server/friendly-errors";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export async function getSubscriptionRenewalAlert(): Promise<SubscriptionRenewalAlert> {
  if (!isSupabaseConfigured()) {
    return { show: false, message: "", renewalDate: null, daysRemaining: null };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { show: false, message: "", renewalDate: null, daysRemaining: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "plan, subscription_status, subscription_renewal_at, last_renewal_warning_at, email"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return { show: false, message: "", renewalDate: null, daysRemaining: null };
    }

    return await syncSubscriptionRenewalReminder({
      userId: user.id,
      email: profile.email ?? user.email ?? null,
      plan: profile.plan ?? "free",
      subscriptionStatus: profile.subscription_status ?? "active",
      renewalAt: profile.subscription_renewal_at ?? null,
      lastWarningAt: profile.last_renewal_warning_at ?? null,
    });
  } catch (err) {
    return buildRenewalAlert({
      plan: "free",
      subscriptionStatus: "active",
      renewalAt: null,
    });
  }
}

export async function dismissRenewalAlert(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) return { ok: true };

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in again." };

    await supabase
      .from("profiles")
      .update({ last_renewal_warning_at: new Date().toISOString() })
      .eq("id", user.id);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err, "Could not dismiss this alert.") };
  }
}
