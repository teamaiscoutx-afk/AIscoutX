import { PRO_PRICE_DISPLAY } from "@/lib/billing/constants";
import { sendSubscriptionRenewalWarningEmail } from "@/lib/email";
import { logServerError } from "@/lib/server/safe-action";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const RENEWAL_WINDOW_DAYS = 7;
const WARNING_COOLDOWN_DAYS = 5;

export type SubscriptionRenewalAlert = {
  show: boolean;
  message: string;
  renewalDate: string | null;
  daysRemaining: number | null;
};

function daysUntil(iso: string): number {
  const ms = Date.parse(iso) - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function buildRenewalAlert(input: {
  plan: string;
  subscriptionStatus: string;
  renewalAt: string | null;
}): SubscriptionRenewalAlert {
  if (
    input.plan !== "pro" ||
    input.subscriptionStatus !== "active" ||
    !input.renewalAt
  ) {
    return { show: false, message: "", renewalDate: null, daysRemaining: null };
  }

  const daysRemaining = daysUntil(input.renewalAt);
  if (daysRemaining > RENEWAL_WINDOW_DAYS || daysRemaining < 0) {
    return {
      show: false,
      message: "",
      renewalDate: input.renewalAt,
      daysRemaining,
    };
  }

  const formatted = new Date(input.renewalAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    show: true,
    message: `Your Pro plan (${PRO_PRICE_DISPLAY}) renews on ${formatted}. Keep access to Founder GPS, workspaces, and AI Mentor Chat.`,
    renewalDate: input.renewalAt,
    daysRemaining,
  };
}

/** Check renewal window and send email reminder at most once per cooldown period. */
export async function syncSubscriptionRenewalReminder(input: {
  userId: string;
  email: string | null;
  plan: string;
  subscriptionStatus: string;
  renewalAt: string | null;
  lastWarningAt: string | null;
}): Promise<SubscriptionRenewalAlert> {
  const alert = buildRenewalAlert(input);
  if (!alert.show || !input.email || !input.renewalAt) return alert;

  const lastWarnMs = input.lastWarningAt ? Date.parse(input.lastWarningAt) : 0;
  const cooldownMs = WARNING_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - lastWarnMs < cooldownMs) return alert;

  const sent = await sendSubscriptionRenewalWarningEmail(input.email, {
    renewalDate: input.renewalAt,
    amountLabel: PRO_PRICE_DISPLAY,
  });

  if (sent) {
    const supabase = createServiceRoleSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from("profiles")
        .update({ last_renewal_warning_at: new Date().toISOString() })
        .eq("id", input.userId);
      if (error) logServerError("billing.renewalWarning", error);
    }
  }

  return alert;
}

export function nextRenewalDate(from = new Date()): string {
  const next = new Date(from);
  next.setDate(next.getDate() + 30);
  return next.toISOString();
}
