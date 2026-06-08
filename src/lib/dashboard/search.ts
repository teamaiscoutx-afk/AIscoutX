import type { Opportunity } from "@/lib/dashboard/opportunities";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function opportunityHaystack(opportunity: Opportunity): string {
  return normalize(
    [
      opportunity.name,
      opportunity.category,
      opportunity.competitionLabel,
      opportunity.trendStage,
      ...opportunity.keywords,
      ...opportunity.sources,
    ].join(" ")
  );
}

/**
 * Token-based fuzzy search — each query token must match somewhere in
 * name, category, or keyword tags (partial substring match).
 */
export function searchOpportunities(
  opportunities: Opportunity[],
  searchQuery: string
): Opportunity[] {
  const tokens = tokenize(searchQuery);
  if (tokens.length === 0) return opportunities;

  return opportunities.filter((opportunity) => {
    const haystack = opportunityHaystack(opportunity);
    return tokens.every((token) => haystack.includes(token));
  });
}
