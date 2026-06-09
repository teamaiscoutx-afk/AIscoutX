import type { OpportunityRow } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import {
  normalizeIntelligence,
  normalizeModeData,
  resolveDrawerContent,
} from "@/lib/dashboard/mode-data-normalize";
import type {
  Opportunity,
  OpportunityDrawerContent,
  TrendStage,
} from "@/lib/dashboard/opportunities";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";

export function deriveDrawerFromIntelligence(
  intelligence: ModeIntelligence
): OpportunityDrawerContent {
  return resolveDrawerContent({}, intelligence);
}

export function mapOpportunityRowToClient(row: OpportunityRow): Opportunity {
  const modeData = normalizeModeData(row.mode_data);
  const intelligence = modeData.intelligence ?? normalizeIntelligence(null);
  const trendStage = (modeData.trendStage ?? "Emerging") as TrendStage;

  return {
    id: row.id,
    name: row.title,
    category: row.category,
    score: row.score,
    aiConfidence: modeData.aiConfidence ?? row.score,
    growth: row.growth,
    hot: modeData.hot ?? false,
    competitionLabel: modeData.competitionLabel ?? "Medium",
    trendStage,
    scores: {
      demand: row.demand,
      competition: row.competition,
      virality: modeData.virality ?? Math.round((row.demand + row.score) / 2),
      monetization:
        modeData.monetization ?? Math.round((row.score + row.demand) / 2),
      disruption: modeData.disruption,
    },
    revenuePotential: modeData.revenuePotential ?? "$1k–$5k/mo",
    sources: modeData.sources ?? ["Reddit", "Product Hunt"],
    keywords: modeData.keywords ?? [],
    intelligence,
    drawer: modeData.drawer ?? resolveDrawerContent(modeData, intelligence),
    deepDive: modeData.deepDive,
    workspace: row.workspace_mode ?? undefined,
    niche: (row.current_niche as NicheId | null) ?? undefined,
  };
}

export function buildActionPlanMarkdown(opportunity: Opportunity): string {
  const { intelligence: i, drawer } = opportunity;

  return [
    `## ${opportunity.name}`,
    "",
    `**Category:** ${opportunity.category} · **Momentum:** ${opportunity.growth}`,
    "",
    "### Why this matters",
    drawer.whyThisMatters,
    "",
    "### Recommended action",
    drawer.recommendedAction,
    "",
    "### Target clients",
    drawer.targetClients,
    "",
    "### Founder playbook",
    `- **Problem:** ${i.founder.problem}`,
    `- **Solution:** ${i.founder.solution}`,
    `- **MVP:** ${i.founder.mvp}`,
    `- **Launch window:** ${i.founder.launchTime}`,
    "",
    "### Creator angles",
    ...i.creator.videoTitles.map((t) => `- ${t}`),
    "",
    "### Agency offer",
    `- ${i.agency.serviceOffer}`,
    `- **ICP:** ${i.agency.icp}`,
    `- **Retainer:** ${i.agency.retainer}`,
  ].join("\n");
}

export function mapOpportunityToInsertRow(
  opportunity: Opportunity
): Database["public"]["Tables"]["opportunities"]["Insert"] {
  const actionPlanMarkdown = buildActionPlanMarkdown(opportunity);

  return {
    title: opportunity.name,
    score: opportunity.score,
    growth: opportunity.growth,
    demand: opportunity.scores.demand,
    competition: opportunity.scores.competition,
    category: opportunity.category,
    workspace_mode: opportunity.workspace ?? null,
    current_niche: opportunity.niche ?? null,
    mode_data: {
      aiConfidence: opportunity.aiConfidence,
      competitionLabel: opportunity.competitionLabel,
      trendStage: opportunity.trendStage,
      virality: opportunity.scores.virality,
      monetization: opportunity.scores.monetization,
      revenuePotential: opportunity.revenuePotential,
      sources: opportunity.sources,
      keywords: opportunity.keywords,
      hot: opportunity.hot ?? false,
      intelligence: opportunity.intelligence,
      drawer: opportunity.drawer,
      actionPlanMarkdown,
      deepDive: opportunity.deepDive,
      disruption: opportunity.scores.disruption,
      liveSynthesizedAt: opportunity.deepDive?.synthesizedAt,
    },
  };
}

export function filterOpportunitiesByContext(
  opportunities: Opportunity[],
  workspace: WorkspaceIdentity,
  niche: NicheId
): Opportunity[] {
  const scoped = opportunities.filter((item) => {
    if (!item.workspace && !item.niche) return true;
    const workspaceMatch = !item.workspace || item.workspace === workspace;
    const nicheMatch = !item.niche || item.niche === niche;
    return workspaceMatch && nicheMatch;
  });

  return scoped.length > 0 ? scoped : opportunities;
}
