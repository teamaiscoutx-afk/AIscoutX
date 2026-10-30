import type { SubscriptionTier } from "@/lib/database.types";
import {
  FREEMIUM_WELCOME_ALLOWANCE,
  FREEMIUM_WELCOME_CREDITS,
} from "@/lib/billing/freemium";
import { createServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  creditCostForAction,
  type CreditAction,
} from "@/lib/billing/credit-costs";

export type CreditSnapshot = {
  remaining: number;
  allowance: number;
  used: number;
  resetAt: string;
  bufferUsed: boolean;
  subscriptionTier: SubscriptionTier;
};

export type DeductCreditsResult =
  | {
      ok: true;
      snapshot: CreditSnapshot;
      warning?: string;
    }
  | {
      ok: false;
      error: "insufficient_credits" | "profile_not_found" | "not_configured" | "rpc_failed";
      message: string;
      snapshot?: CreditSnapshot;
    };

function defaultNextResetIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

function snapshotFromRow(row: {
  credits_balance: number;
  monthly_allowance: number;
  next_reset_date: string | null;
  buffer_used: boolean;
  subscription_tier: SubscriptionTier;
}): CreditSnapshot {
  const remaining = Math.max(0, row.credits_balance);
  const allowance = Math.max(1, row.monthly_allowance);
  return {
    remaining,
    allowance,
    used: Math.max(0, allowance - remaining),
    resetAt: row.next_reset_date ?? defaultNextResetIso(),
    bufferUsed: row.buffer_used,
    subscriptionTier: row.subscription_tier,
  };
}

export async function getCreditSnapshotForUser(userId: string): Promise<CreditSnapshot | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createServiceRoleSupabaseClient();
  if (admin) {
    await admin.rpc("maybe_reset_user_credits", { p_user_id: userId });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "credits_balance, monthly_allowance, next_reset_date, buffer_used, subscription_tier"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return snapshotFromRow({
    credits_balance: data.credits_balance ?? FREEMIUM_WELCOME_CREDITS,
    monthly_allowance: data.monthly_allowance ?? FREEMIUM_WELCOME_ALLOWANCE,
    next_reset_date: data.next_reset_date,
    buffer_used: data.buffer_used ?? false,
    subscription_tier: (data.subscription_tier ?? "free") as SubscriptionTier,
  });
}

export async function deductCreditsForAction(
  userId: string,
  action: CreditAction
): Promise<DeductCreditsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "not_configured",
      message: "Billing database is not configured.",
    };
  }

  const admin = createServiceRoleSupabaseClient();
  if (!admin) {
    return {
      ok: false,
      error: "not_configured",
      message: "Service role is required for credit deduction.",
    };
  }

  const amount = creditCostForAction(action);
  const { data, error } = await admin.rpc("deduct_user_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    return {
      ok: false,
      error: "rpc_failed",
      message: error.message,
    };
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    remaining?: number;
    allowance?: number;
    used?: number;
    warning?: string | null;
    buffer_used?: boolean;
  };

  if (!payload?.ok) {
    const snapshot = await getCreditSnapshotForUser(userId);
    return {
      ok: false,
      error:
        payload.error === "insufficient_credits"
          ? "insufficient_credits"
          : payload.error === "profile_not_found"
            ? "profile_not_found"
            : "rpc_failed",
      message:
        payload.error === "insufficient_credits"
          ? "You are out of credits. Top up or wait for your monthly reset."
          : "Could not deduct credits.",
      snapshot: snapshot ?? undefined,
    };
  }

  const fresh = await getCreditSnapshotForUser(userId);
  const snapshot: CreditSnapshot = fresh ?? {
    remaining: payload.remaining ?? 0,
    allowance: payload.allowance ?? 200,
    used: payload.used ?? 0,
    resetAt: defaultNextResetIso(),
    bufferUsed: Boolean(payload.buffer_used),
    subscriptionTier: "free",
  };

  return {
    ok: true,
    snapshot,
    warning: payload.warning ?? undefined,
  };
}

/** Idempotent — grants 20 welcome credits once for new freemium accounts. */
export async function ensureWelcomeCreditsForUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const admin = createServiceRoleSupabaseClient();
  if (!admin) return false;

  const { error } = await admin.rpc("grant_welcome_credits", { p_user_id: userId });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("grant_welcome_credits")) {
      const { data: profile } = await admin
        .from("profiles")
        .select("welcome_credits_granted")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.welcome_credits_granted) return true;

      const { error: updateError } = await admin
        .from("profiles")
        .update({
          credits_balance: FREEMIUM_WELCOME_CREDITS,
          monthly_allowance: FREEMIUM_WELCOME_ALLOWANCE,
          subscription_tier: "free",
          welcome_credits_granted: true,
          buffer_used: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .eq("welcome_credits_granted", false);

      return !updateError;
    }
    return false;
  }

  return true;
}

export async function addBonusCredits(userId: string, amount: number): Promise<boolean> {
  if (!isSupabaseConfigured() || amount < 1) return false;
  const admin = createServiceRoleSupabaseClient();
  if (!admin) return false;

  const { data } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  const current = typeof data?.credits_balance === "number" ? data.credits_balance : 0;
  const { error } = await admin
    .from("profiles")
    .update({
      credits_balance: current + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !error;
}
