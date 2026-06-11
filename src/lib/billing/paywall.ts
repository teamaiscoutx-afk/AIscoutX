import { normalizePlanTier } from "@/lib/billing/tier-limits";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const UPGRADE_REQUIRED = "UPGRADE_REQUIRED" as const;

export type PaywallCheck = {
  allowed: boolean;
  code?: typeof UPGRADE_REQUIRED;
  reason?: string;
};

const PRO_FEATURE_COPY: Record<string, string> = {
  blueprint: "Generate Blueprint is a Pro feature. Upgrade to run unlimited blueprints.",
  deepdive: "Deep Dive specs are a Pro feature. Upgrade to see cited market gaps and MVP anatomy.",
  gps: "Founder GPS is a Pro feature. Upgrade to track validation, MVP, and launch scores.",
  chat: "AI Founder Chat is a Pro feature. Upgrade for unlimited strategy sessions.",
};

/** True when the signed-in user has an active Pro subscription. */
export async function isProUser(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    return (
      normalizePlanTier(profile?.plan) === "pro" &&
      (profile?.subscription_status ?? "active") === "active"
    );
  } catch {
    return false;
  }
}

/**
 * Server-side Pro gate. Reads the signed-in user's plan directly from
 * the database — never trusts client-provided plan values.
 */
export async function requirePro(
  feature: keyof typeof PRO_FEATURE_COPY
): Promise<PaywallCheck> {
  if (!isSupabaseConfigured()) {
    // Local dev without Supabase: allow so the pipeline stays testable.
    return { allowed: true };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        allowed: false,
        code: UPGRADE_REQUIRED,
        reason: "Sign in to continue.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const plan = normalizePlanTier(profile?.plan);
    const status = profile?.subscription_status ?? "active";

    if (plan === "pro" && status === "active") {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: UPGRADE_REQUIRED,
      reason: PRO_FEATURE_COPY[feature],
    };
  } catch {
    return {
      allowed: false,
      code: UPGRADE_REQUIRED,
      reason: PRO_FEATURE_COPY[feature],
    };
  }
}
