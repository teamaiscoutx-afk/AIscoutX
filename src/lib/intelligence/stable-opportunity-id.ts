import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";

export function slugifyOpportunityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Deterministic catalog id so Discover feed stays stable across refreshes. */
export function stableOpportunityId(
  name: string,
  workspace: WorkspaceIdentity,
  niche: NicheId,
  catalogSource: "live" | "optimized" | "seed" = "live"
): string {
  const slug = slugifyOpportunityName(name) || "idea";
  return `${catalogSource}-${workspace}-${niche}-${slug}`;
}
