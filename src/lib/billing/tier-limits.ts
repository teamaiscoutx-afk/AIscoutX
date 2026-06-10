export type PlanTier = "free" | "pro";

export type SubscriptionStatus = "active" | "canceled";

export const FREE_TIER_LIMITS = {
  opportunityViewsPerDay: 5,
  opportunityExpansionsPerMonth: 2,
  blueprintsPerMonth: 2,
  savedIdeasMax: 5,
  chatMessagesPerMonth: 10,
} as const;

export const CHAT_LIMIT_MESSAGE =
  "✨ You have reached your free strategy limit. Upgrade to Pro for unlimited advisory support.";

/** Map legacy plan values (starter/agency) to the two-tier model. */
export function normalizePlanTier(
  plan: string | null | undefined
): PlanTier {
  if (plan === "pro" || plan === "starter" || plan === "agency") return "pro";
  return "free";
}

export function isPaidPlan(plan: PlanTier | string | null | undefined): boolean {
  return normalizePlanTier(plan) === "pro";
}

export function canAccessDeepAnalysis(plan: PlanTier | string | null | undefined): boolean {
  return isPaidPlan(plan);
}

export function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
