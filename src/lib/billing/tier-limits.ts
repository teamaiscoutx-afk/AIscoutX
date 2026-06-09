export type PlanTier = "free" | "starter" | "pro" | "agency";

export const FREE_TIER_LIMITS = {
  opportunityViewsPerDay: 5,
  blueprintsPerMonth: 2,
  savedIdeasMax: 5,
  chatMessagesPerMonth: 20,
} as const;

export function isPaidPlan(plan: PlanTier | string | null | undefined): boolean {
  return plan === "starter" || plan === "pro" || plan === "agency";
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
