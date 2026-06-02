import { getNicheFeedByKey } from "@/lib/dashboard/niche-feeds";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import { mockOpportunities } from "@/lib/dashboard/opportunities";

/** Curated premium signals to seed into Supabase */
const EXTRA_SEED_CONTEXTS: {
  workspace: WorkspaceIdentity;
  niche: NicheId;
}[] = [
  { workspace: "founder", niche: "ai-tools" },
  { workspace: "creator", niche: "tech-ai" },
  { workspace: "founder", niche: "b2b-saas" },
  { workspace: "creator", niche: "finance-business" },
];

/**
 * All mock opportunities merged with niche-feed highlights
 * (e.g. Prompt-to-Product Builders, AI Voice Cloning).
 */
export function getSeedOpportunities(): Opportunity[] {
  const byTitle = new Map<string, Opportunity>();

  for (const opportunity of mockOpportunities) {
    byTitle.set(opportunity.name, {
      ...opportunity,
      workspace: opportunity.workspace ?? "founder",
      niche: opportunity.niche ?? "b2b-saas",
    });
  }

  for (const ctx of EXTRA_SEED_CONTEXTS) {
    const feed = getNicheFeedByKey(ctx.workspace, ctx.niche);
    for (const opportunity of feed.opportunities) {
      byTitle.set(opportunity.name, {
        ...opportunity,
        workspace: ctx.workspace,
        niche: ctx.niche,
      });
    }
  }

  return Array.from(byTitle.values());
}
