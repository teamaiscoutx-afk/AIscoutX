import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { filterOpportunitiesByContext } from "@/lib/dashboard/opportunity-mapper";
import type { Opportunity } from "@/lib/dashboard/opportunities";

export function filterOpportunitiesByWorkspace(
  opportunities: Opportunity[],
  workspace: WorkspaceIdentity
): Opportunity[] {
  const scoped = opportunities.filter(
    (item) => !item.workspace || item.workspace === workspace
  );
  return scoped.length > 0 ? scoped : opportunities;
}

export function filterOpportunitiesByWorkspaceAndNiche(
  opportunities: Opportunity[],
  workspace: WorkspaceIdentity,
  niche: NicheId
): Opportunity[] {
  return filterOpportunitiesByContext(opportunities, workspace, niche);
}

export function pickOpportunityOfTheDay(
  opportunities: Opportunity[]
): Opportunity | null {
  if (opportunities.length === 0) return null;
  return [...opportunities].sort((a, b) => b.score - a.score)[0];
}

export function deriveTrendingKeywords(opportunities: Opportunity[]): string[] {
  const counts = new Map<string, number>();

  for (const opportunity of opportunities) {
    for (const keyword of opportunity.keywords) {
      const key = keyword.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);

  if (sorted.length >= 4) {
    return sorted.slice(0, 6);
  }

  const fallback = opportunities.flatMap((o) => o.keywords);
  return Array.from(new Set(sorted.concat(fallback))).slice(0, 6);
}

export function deriveViralHooks(opportunities: Opportunity[]): string[] {
  const hooks: string[] = [];

  for (const opportunity of opportunities) {
    for (const hook of opportunity.intelligence.creator.hooks) {
      if (hook.trim()) hooks.push(hook);
    }
    if (opportunity.drawer.whyThisMatters.trim()) {
      hooks.push(opportunity.drawer.whyThisMatters);
    }
  }

  const unique = Array.from(new Set(hooks));
  if (unique.length >= 3) {
    return unique.slice(0, 3);
  }

  return [
    "Nobody is talking about this niche yet—but the data says it's about to explode.",
    "I scanned 10,000 posts so you don't have to. Here's the opportunity everyone's missing.",
    "This isn't hype. Demand is up 200%+ and competition is still low.",
  ];
}

export function buildFeedViewModel(allOpportunities: Opportunity[]) {
  // Rows are fetched per workspace/niche live batch — no secondary filtering.
  const opportunities = allOpportunities;
  const opportunityOfDay = pickOpportunityOfTheDay(opportunities);

  return {
    opportunities,
    opportunityOfTheDayId: opportunityOfDay?.id ?? null,
    trendingKeywords: deriveTrendingKeywords(opportunities),
    viralHooks: deriveViralHooks(opportunities),
  };
}
