import type { UsageSnapshot } from "@/app/actions/usage";

const UNLIMITED = 999_999;

/** Replace non-serializable Infinity for RSC → client props. */
export function sanitizeUsageSnapshot(usage: UsageSnapshot): UsageSnapshot {
  return {
    ...usage,
    opportunityViewsLimit:
      usage.opportunityViewsLimit === Infinity
        ? UNLIMITED
        : usage.opportunityViewsLimit,
    blueprintsLimit:
      usage.blueprintsLimit === Infinity ? UNLIMITED : usage.blueprintsLimit,
    chatMessagesLimit:
      usage.chatMessagesLimit === Infinity ? UNLIMITED : usage.chatMessagesLimit,
    savedIdeasLimit:
      usage.savedIdeasLimit === Infinity ? UNLIMITED : usage.savedIdeasLimit,
  };
}

export function isUnlimitedLimit(value: number): boolean {
  return value >= UNLIMITED;
}
