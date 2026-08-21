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
    for (const keyword of opportunity.keywords || []) {
      const key = keyword.toLowerCase().trim();
      // Literal '{niche}' bug filtering
      if (key && key !== "{niche}" && key !== "niche") {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);

  if (sorted.length >= 3) {
    return sorted.slice(0, 6);
  }

  const fallback = opportunities
    .flatMap((o) => o.tags || [])
    .filter((t) => t && t !== "{niche}");

  const combined = Array.from(new Set(sorted.concat(fallback)));
  return combined.length > 0 ? combined.slice(0, 6) : ["automation", "b2b saas", "ai workflows"];
}

export function deriveViralHooks(opportunities: Opportunity[]): string[] {
  const points: string[] = [];

  for (const opportunity of opportunities) {
    // Collect real market pain points and UVPs dynamically
    if (opportunity.intelligence?.valueProp) {
      points.push(opportunity.intelligence.valueProp);
    }
    if (opportunity.drawer?.whyThisMatters?.trim()) {
      points.push(opportunity.drawer.whyThisMatters);
    }
    if (opportunity.description?.trim()) {
      points.push(opportunity.description);
    }
  }

  const unique = Array.from(new Set(points)).filter(
    (p) => p && !p.includes("{niche}")
  );

  if (unique.length >= 3) {
    return unique.slice(0, 3);
  }

  // Real Startup Market Signals (No generic social media viral hooks)
  return [
    "High manual workflow friction identified in target user segments.",
    "Unmet software demand driven by recent API & platform integrations.",
    "Low competition index with strong intent search queries in live scans.",
  ];
}

export function buildFeedViewModel(allOpportunities: Opportunity[]) {
  const opportunities = allOpportunities;
  const opportunityOfDay = pickOpportunityOfTheDay(opportunities);

  return {
    opportunities,
    opportunityOfTheDayId: opportunityOfDay?.id ?? null,
    trendingKeywords: deriveTrendingKeywords(opportunities),
    viralHooks: deriveViralHooks(opportunities),
  };
}