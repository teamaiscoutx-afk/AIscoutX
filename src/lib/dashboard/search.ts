import type { Opportunity } from "@/lib/dashboard/opportunities";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "and",
  "or",
  "to",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "of",
  "is",
  "are",
  "was",
  "be",
  "me",
  "my",
  "i",
  "it",
  "as",
  "so",
  "if",
  "but",
  "about",
  "into",
  "that",
  "this",
  "your",
  "our",
  "all",
  "any",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function significantTokens(query: string): string[] {
  return tokenize(query).filter(
    (token) => token.length >= 2 && !STOP_WORDS.has(token)
  );
}

function opportunityHaystack(opportunity: Opportunity): string {
  const intel = opportunity.intelligence;
  return normalize(
    [
      opportunity.name,
      opportunity.category,
      opportunity.competitionLabel,
      opportunity.trendStage,
      opportunity.revenuePotential,
      ...opportunity.keywords,
      ...opportunity.sources,
      intel.founder.problem,
      intel.founder.solution,
      intel.founder.mvp,
      intel.creator.platform,
      ...intel.creator.videoTitles,
      ...intel.creator.hooks,
      intel.agency.serviceOffer,
      intel.agency.icp,
      opportunity.drawer.whyThisMatters,
      opportunity.drawer.recommendedAction,
      opportunity.drawer.targetClients,
      ...opportunity.drawer.viralVideoIdeas,
    ].join(" ")
  );
}

function scoreOpportunity(
  opportunity: Opportunity,
  tokens: string[],
  phrase: string
): number {
  const haystack = opportunityHaystack(opportunity);
  let score = 0;

  if (phrase.length > 2 && haystack.includes(phrase)) {
    score += 6;
  }

  for (const token of tokens) {
    if (!haystack.includes(token)) continue;

    score += 1;

    if (normalize(opportunity.name).includes(token)) score += 3;
    if (normalize(opportunity.category).includes(token)) score += 2;
    if (opportunity.keywords.some((kw) => normalize(kw).includes(token))) {
      score += 2;
    }
  }

  return score;
}

/**
 * Natural-language fuzzy search — ignores filler words (for, the, etc.),
 * scores relevance, and returns best matches first.
 */
export function searchOpportunities(
  opportunities: Opportunity[],
  searchQuery: string
): Opportunity[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return opportunities;

  const phrase = normalize(trimmed);
  const tokens = significantTokens(trimmed);

  if (tokens.length === 0) {
    return opportunities.filter((opportunity) =>
      opportunityHaystack(opportunity).includes(phrase)
    );
  }

  const ranked = opportunities
    .map((opportunity) => ({
      opportunity,
      score: scoreOpportunity(opportunity, tokens, phrase),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.map((entry) => entry.opportunity);
}
