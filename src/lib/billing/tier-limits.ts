export type PlanTier = "free" | "pro";

export type SubscriptionStatus = "active" | "canceled";

/** Free tier — generous discovery; Pro unlocks unlimited + premium exports. */
export const FREE_TIER_LIMITS = {
  /** Discovery feed + niche switching — not enforced in UI. */
  opportunityViewsPerDay: Number.POSITIVE_INFINITY,
  opportunityExpansionsPerMonth: Number.POSITIVE_INFINITY,
  blueprintsPerMonth: 3,
  savedIdeasMax: 25,
  chatMessagesPerMonth: 10,
  activeProjectsMax: 1,
} as const;

export const BLUEPRINT_LIMIT_MESSAGE =
  "You've used your 3 free blueprint generations this month. Upgrade to Pro for unlimited runs + PDF export.";

export const CHAT_LIMIT_MESSAGE =
  "You've reached your free chat limit this month. Upgrade to Pro for unlimited AI founder strategy.";

export const PDF_EXPORT_MESSAGE =
  "1-Click PDF Export is a Pro feature. Upgrade to download client-ready blueprint decks.";

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

export function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
