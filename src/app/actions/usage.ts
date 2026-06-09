"use server";

import type { PlanTier } from "@/lib/billing/tier-limits";
import {
  FREE_TIER_LIMITS,
  isPaidPlan,
  monthKey,
  todayKey,
} from "@/lib/billing/tier-limits";
import type { UsageWalletRow } from "@/lib/database.types";
import { getCurrentProfile } from "@/app/actions/profile";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type UsageSnapshot = {
  plan: PlanTier;
  isPaid: boolean;
  opportunityViewsToday: number;
  opportunityViewsLimit: number;
  blueprintsThisMonth: number;
  blueprintsLimit: number;
  chatMessagesThisMonth: number;
  chatMessagesLimit: number;
  savedIdeasCount: number;
  savedIdeasLimit: number;
};

const DEMO_USAGE: UsageSnapshot = {
  plan: "free",
  isPaid: false,
  opportunityViewsToday: 0,
  opportunityViewsLimit: FREE_TIER_LIMITS.opportunityViewsPerDay,
  blueprintsThisMonth: 0,
  blueprintsLimit: FREE_TIER_LIMITS.blueprintsPerMonth,
  chatMessagesThisMonth: 0,
  chatMessagesLimit: FREE_TIER_LIMITS.chatMessagesPerMonth,
  savedIdeasCount: 0,
  savedIdeasLimit: FREE_TIER_LIMITS.savedIdeasMax,
};

async function ensureWallet(userId: string): Promise<UsageWalletRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("usage_wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created } = await supabase
    .from("usage_wallets")
    .insert({ user_id: userId })
    .select("*")
    .single();

  return created ?? null;
}

function resetWalletCounters(wallet: UsageWalletRow): UsageWalletRow {
  const today = todayKey();
  const month = monthKey();
  return {
    ...wallet,
    opportunity_views_today:
      wallet.opportunity_views_date === today ? wallet.opportunity_views_today : 0,
    opportunity_views_date: today,
    blueprints_this_month:
      wallet.blueprints_month_key === month ? wallet.blueprints_this_month : 0,
    blueprints_month_key: month,
    chat_messages_this_month:
      wallet.chat_month_key === month ? wallet.chat_messages_this_month : 0,
    chat_month_key: month,
  };
}

export async function getUsageSnapshot(): Promise<UsageSnapshot> {
  const profile = await getCurrentProfile();
  const plan = (profile?.plan ?? "free") as PlanTier;
  const paid = isPaidPlan(plan);

  if (!isSupabaseConfigured() || !profile) {
    return { ...DEMO_USAGE, plan, isPaid: paid };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ...DEMO_USAGE, plan, isPaid: paid };

    const wallet = resetWalletCounters(
      (await ensureWallet(user.id)) ?? {
        user_id: user.id,
        opportunity_views_today: 0,
        opportunity_views_date: todayKey(),
        blueprints_this_month: 0,
        blueprints_month_key: monthKey(),
        chat_messages_this_month: 0,
        chat_month_key: monthKey(),
        updated_at: new Date().toISOString(),
      }
    );

    const { count: savedCount } = await supabase
      .from("saved_opportunities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return {
      plan,
      isPaid: paid,
      opportunityViewsToday: wallet.opportunity_views_today,
      opportunityViewsLimit: paid
        ? Infinity
        : FREE_TIER_LIMITS.opportunityViewsPerDay,
      blueprintsThisMonth: wallet.blueprints_this_month,
      blueprintsLimit: paid ? Infinity : FREE_TIER_LIMITS.blueprintsPerMonth,
      chatMessagesThisMonth: wallet.chat_messages_this_month,
      chatMessagesLimit: paid ? Infinity : FREE_TIER_LIMITS.chatMessagesPerMonth,
      savedIdeasCount: savedCount ?? 0,
      savedIdeasLimit: paid ? Infinity : FREE_TIER_LIMITS.savedIdeasMax,
    };
  } catch {
    return { ...DEMO_USAGE, plan, isPaid: paid };
  }
}

export async function checkOpportunityView(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getUsageSnapshot();
  if (usage.isPaid) return { allowed: true };
  if (usage.opportunityViewsToday >= usage.opportunityViewsLimit) {
    return {
      allowed: false,
      reason: `Free plan limit: ${FREE_TIER_LIMITS.opportunityViewsPerDay} opportunity views per day. Upgrade to Starter for unlimited access.`,
    };
  }
  return { allowed: true };
}

export async function incrementOpportunityView(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await getCurrentProfile();
  if (isPaidPlan(profile?.plan)) return;

  const wallet = resetWalletCounters((await ensureWallet(user.id))!);
  await supabase
    .from("usage_wallets")
    .update({
      opportunity_views_today: wallet.opportunity_views_today + 1,
      opportunity_views_date: todayKey(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function checkBlueprintGeneration(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getUsageSnapshot();
  if (usage.isPaid) return { allowed: true };
  if (usage.blueprintsThisMonth >= usage.blueprintsLimit) {
    return {
      allowed: false,
      reason: `Free plan limit: ${FREE_TIER_LIMITS.blueprintsPerMonth} blueprints per month. Upgrade to Starter for unlimited generation.`,
    };
  }
  return { allowed: true };
}

export async function incrementBlueprintUsage(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await getCurrentProfile();
  if (isPaidPlan(profile?.plan)) return;

  const wallet = resetWalletCounters((await ensureWallet(user.id))!);
  await supabase
    .from("usage_wallets")
    .update({
      blueprints_this_month: wallet.blueprints_this_month + 1,
      blueprints_month_key: monthKey(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function checkChatMessage(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getUsageSnapshot();
  if (usage.isPaid) return { allowed: true };
  if (usage.chatMessagesThisMonth >= usage.chatMessagesLimit) {
    return {
      allowed: false,
      reason: `Free plan limit: ${FREE_TIER_LIMITS.chatMessagesPerMonth} chat messages per month. Upgrade to Starter for unlimited chat.`,
    };
  }
  return { allowed: true };
}

export async function incrementChatMessage(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await getCurrentProfile();
  if (isPaidPlan(profile?.plan)) return;

  const wallet = resetWalletCounters((await ensureWallet(user.id))!);
  await supabase
    .from("usage_wallets")
    .update({
      chat_messages_this_month: wallet.chat_messages_this_month + 1,
      chat_month_key: monthKey(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function checkSavedIdea(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getUsageSnapshot();
  if (usage.isPaid) return { allowed: true };
  if (usage.savedIdeasCount >= usage.savedIdeasLimit) {
    return {
      allowed: false,
      reason: `Free plan limit: ${FREE_TIER_LIMITS.savedIdeasMax} saved ideas. Upgrade to Starter for unlimited storage.`,
    };
  }
  return { allowed: true };
}
