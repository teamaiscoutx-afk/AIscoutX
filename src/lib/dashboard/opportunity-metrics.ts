import type { OpportunityModeData } from "@/lib/database.types";
import type { OpportunityRow } from "@/lib/database.types";
import type { Opportunity, ScoreBreakdown, TrendStage } from "@/lib/dashboard/opportunities";

/** Raw LLM / legacy DB shapes for live discovery cards. */
export type RawOpportunityMetrics = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickNumber(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.round(value);
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(parsed)) return Math.round(parsed);
    }
  }
  return undefined;
}

function pickString(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function formatGrowthLabel(value: number | undefined, fallback?: string): string {
  if (fallback?.trim()) return fallback;
  if (value === undefined) return "+0%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

export type NormalizedOpportunityMetrics = {
  score: number;
  growth: string;
  demand: number;
  competition: number;
  momentum: number;
  virality: number;
  monetization: number;
  disruption?: number;
  trendStage: TrendStage;
  competitionLabel: "Low" | "Medium" | "High";
  aiConfidence: number;
};

const DEFAULT_TREND: TrendStage = "Emerging";

/**
 * Unifies snake_case LLM fields (growth_score, demand_data) with client Opportunity shape.
 */
export function extractOpportunityMetrics(
  row: Pick<OpportunityRow, "score" | "growth" | "demand" | "competition" | "mode_data">,
  modeData: OpportunityModeData = normalizeModeDataFromRow(row.mode_data)
): NormalizedOpportunityMetrics {
  const root = asRecord(row.mode_data) ?? {};
  const scoresBlock = asRecord(root.scores) ?? asRecord(modeData.scores) ?? root;

  const demand =
    pickNumber(scoresBlock, "demand", "demand_score", "demand_data", "demandScore") ??
    (Number.isFinite(row.demand) ? row.demand : undefined) ??
    pickNumber(root, "demand", "demand_score", "demand_data") ??
    row.score;

  const competition =
    pickNumber(scoresBlock, "competition", "competition_score", "competitionScore") ??
    (Number.isFinite(row.competition) ? row.competition : undefined) ??
    50;

  const virality =
    modeData.virality ??
    pickNumber(scoresBlock, "virality", "virality_score") ??
    Math.round((demand + row.score) / 2);

  const monetization =
    modeData.monetization ??
    pickNumber(scoresBlock, "monetization", "monetization_score") ??
    Math.round((row.score + demand) / 2);

  const momentum =
    pickNumber(scoresBlock, "momentum", "momentum_score", "momentum_data", "momentumScore") ??
    row.score;

  const growthNumeric = pickNumber(
    root,
    "growth_score",
    "growth_data",
    "growthScore",
    "growth_percent"
  );

  const growth =
    pickString(root, "growth", "growth_data", "growth_label", "growthLabel") ??
    row.growth ??
    formatGrowthLabel(growthNumeric);

  const score =
    pickNumber(root, "overall_score", "overallScore", "score", "momentum_score") ??
    row.score;

  const aiConfidence =
    modeData.aiConfidence ??
    pickNumber(root, "ai_confidence", "aiConfidence") ??
    score;

  const trendStage =
    (pickString(root, "trend_stage", "trendStage") as TrendStage | undefined) ??
    modeData.trendStage ??
    DEFAULT_TREND;

  const competitionLabel =
    (pickString(root, "competition_label", "competitionLabel") as
      | NormalizedOpportunityMetrics["competitionLabel"]
      | undefined) ??
    (modeData.competitionLabel as NormalizedOpportunityMetrics["competitionLabel"] | undefined) ??
    "Medium";

  return {
    score,
    growth,
    demand,
    competition,
    momentum,
    virality,
    monetization,
    disruption: modeData.disruption ?? pickNumber(scoresBlock, "disruption", "disruption_score"),
    trendStage,
    competitionLabel,
    aiConfidence,
  };
}

function normalizeModeDataFromRow(raw: unknown): OpportunityModeData {
  const root = asRecord(raw) ?? {};
  return {
    aiConfidence:
      typeof root.aiConfidence === "number"
        ? root.aiConfidence
        : typeof root.ai_confidence === "number"
          ? root.ai_confidence
          : undefined,
    competitionLabel: pickString(root, "competitionLabel", "competition_label") as
      | OpportunityModeData["competitionLabel"]
      | undefined,
    trendStage: pickString(root, "trendStage", "trend_stage") as TrendStage | undefined,
    virality: typeof root.virality === "number" ? root.virality : undefined,
    monetization: typeof root.monetization === "number" ? root.monetization : undefined,
    disruption: typeof root.disruption === "number" ? root.disruption : undefined,
    catalogSource: pickString(root, "catalogSource", "catalog_source") as
      | "live"
      | "seed"
      | undefined,
  };
}

export function normalizeOpportunityList(raw: unknown): Opportunity[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeLooseOpportunity(item))
    .filter((item): item is Opportunity => item !== null);
}

/** Coerce partial LLM/JSON rows into a valid Opportunity for UI loops. */
export function normalizeLooseOpportunity(raw: unknown): Opportunity | null {
  const root = asRecord(raw);
  if (!root) return null;

  const name =
    pickString(root, "name", "title", "idea_name", "ideaName") ?? "Untitled Opportunity";
  const id =
    pickString(root, "id") ??
    `live-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`;

  const pseudoRow = {
    score: pickNumber(root, "score", "overall_score", "momentum_score") ?? 70,
    growth: pickString(root, "growth", "growth_data", "growth_label") ?? "+0%",
    demand: pickNumber(root, "demand", "demand_score", "demand_data") ?? 70,
    competition: pickNumber(root, "competition", "competition_score") ?? 50,
    mode_data: root,
  };

  const metrics = extractOpportunityMetrics(pseudoRow);

  const scores: ScoreBreakdown = {
    demand: metrics.demand,
    competition: metrics.competition,
    virality: metrics.virality,
    monetization: metrics.monetization,
    disruption: metrics.disruption,
  };

  const intelligence =
    (root.intelligence as Opportunity["intelligence"]) ??
    ({
      founder: {
        problem: pickString(root, "problem") ?? "Validated market pain from live web signals.",
        solution: pickString(root, "solution") ?? "Ship a focused MVP for this niche.",
        mvp: pickString(root, "mvp") ?? "Landing page + concierge pilot.",
        launchTime: pickString(root, "launchTime", "launch_time") ?? "21 days",
      },
      creator: {
        videoTitles: ["Opportunity breakdown", "Why this niche is heating up", "Build this in public"],
        hooks: ["Live data backs this angle.", "Low competition window still open."],
        platform: "YouTube + TikTok",
      },
      agency: {
        serviceOffer: "Intelligence sprint + implementation",
        icp: "Founders and operators in this niche",
        retainer: "$2,500–$8,000/mo",
      },
    } satisfies Opportunity["intelligence"]);

  return {
    id,
    name,
    category: pickString(root, "category", "market_segment", "segment") ?? "SaaS",
    score: metrics.score,
    aiConfidence: metrics.aiConfidence,
    growth: metrics.growth,
    hot:
      typeof root.hot === "boolean"
        ? root.hot
        : metrics.trendStage === "Breakout" || metrics.demand >= 80,
    competitionLabel: metrics.competitionLabel,
    trendStage: metrics.trendStage,
    scores,
    revenuePotential:
      pickString(root, "revenuePotential", "revenue_potential") ?? "$1k–$5k/mo",
    sources: Array.isArray(root.sources)
      ? root.sources.map((s) => String(s))
      : ["Reddit", "Product Hunt"],
    keywords: Array.isArray(root.keywords)
      ? root.keywords.map((k) => String(k))
      : [],
    intelligence,
    drawer: {
      whyThisMatters: intelligence.founder.problem,
      recommendedAction: intelligence.founder.solution,
      targetClients: intelligence.agency.icp,
      viralVideoIdeas: intelligence.creator.videoTitles,
    },
    catalogSource: pickString(root, "catalogSource", "catalog_source") as
      | Opportunity["catalogSource"]
      | undefined,
  };
}

export function getOpportunityDisplayMetrics(opportunity: Opportunity) {
  const metrics = extractOpportunityMetrics(
    {
      score: opportunity.score,
      growth: opportunity.growth,
      demand: opportunity.scores.demand,
      competition: opportunity.scores.competition,
      mode_data: {
        virality: opportunity.scores.virality,
        monetization: opportunity.scores.monetization,
        disruption: opportunity.scores.disruption,
        aiConfidence: opportunity.aiConfidence,
        competitionLabel: opportunity.competitionLabel,
        trendStage: opportunity.trendStage,
      },
    },
    {
      virality: opportunity.scores.virality,
      monetization: opportunity.scores.monetization,
      disruption: opportunity.scores.disruption,
      aiConfidence: opportunity.aiConfidence,
      competitionLabel: opportunity.competitionLabel,
      trendStage: opportunity.trendStage,
    }
  );

  return {
    growth: metrics.growth,
    demand: metrics.demand,
    momentum: metrics.momentum,
    score: metrics.score,
  };
}
