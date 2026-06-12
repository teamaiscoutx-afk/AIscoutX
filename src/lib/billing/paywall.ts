import { normalizePlanTier } from "@/lib/billing/tier-limits";
import {
  BLUEPRINT_LIMIT_MESSAGE,
  CHAT_LIMIT_MESSAGE,
  PDF_EXPORT_MESSAGE,
} from "@/lib/billing/tier-limits";
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

export type ProFeature =
  | "pdf"
  | "gps"
  | "chat"
  | "trash"
  | "unlimited";

const PRO_FEATURE_COPY: Record<ProFeature, string> = {
  pdf: PDF_EXPORT_MESSAGE,
  gps: "Founder GPS is a Pro feature. Upgrade to track validation, MVP, and launch scores.",
  chat: CHAT_LIMIT_MESSAGE,
  trash:
    "Trash recovery is a Pro feature. Upgrade to restore projects and blueprints within 30 days.",
  unlimited: BLUEPRINT_LIMIT_MESSAGE,
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
 * Server-side Pro gate for premium-only capabilities (PDF export, GPS, trash, etc.).
 * Discovery, niche switching, and monthly blueprint quota use usage.ts instead.
 */
export async function requirePro(
  feature: ProFeature
): Promise<PaywallCheck> {
  if (!isSupabaseConfigured()) {
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
