import type { TrendStage } from "@/lib/dashboard/opportunities";
import type {
  ChannelSearchResult,
  ComputedMetrics,
  ScoreEngineOutput,
  WebSnippet,
} from "@/lib/intelligence/types";
import { countComplaintSignals } from "@/lib/intelligence/web-search";

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function estimateRecentVelocity(snippets: WebSnippet[]): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let recent = 0;
  for (const s of snippets) {
    if (!s.publishedAt) {
      recent += 0.5;
      continue;
    }
    const ts = Date.parse(s.publishedAt);
    if (!Number.isNaN(ts) && ts >= thirtyDaysAgo) recent += 1;
  }
  return recent;
}

export function computeMetrics(
  channelResults: ChannelSearchResult[],
  allSnippets: WebSnippet[]
): ComputedMetrics {
  const redditMentions = channelResults.find((r) => r.channel === "reddit")?.resultCount ?? 0;
  const xMentions = channelResults.find((r) => r.channel === "x")?.resultCount ?? 0;
  const youtubeMentions =
    channelResults.find((r) => r.channel === "youtube")?.resultCount ?? 0;
  const productHuntMentions =
    channelResults.find((r) => r.channel === "producthunt")?.resultCount ?? 0;
  const githubMentions =
    channelResults.find((r) => r.channel === "github")?.resultCount ?? 0;

  const mentionVolume = allSnippets.length;
  const complaintSignals = countComplaintSignals(allSnippets);
  const competitorAlternatives = productHuntMentions + githubMentions;
  const recentVelocity = estimateRecentVelocity(allSnippets);

  const manualTaskSignals = allSnippets.filter((s) =>
    /manual|spreadsheet|copy.?paste|hours|tedious|workflow/i.test(
      `${s.title} ${s.excerpt}`
    )
  ).length;

  const aiSignals = allSnippets.filter((s) =>
    /ai|gpt|automation|agent|llm|copilot/i.test(`${s.title} ${s.excerpt}`)
  ).length;

  const aiAutomationFit = clamp(
    manualTaskSignals > 0
      ? (aiSignals / Math.max(manualTaskSignals, 1)) * 70 + complaintSignals * 3
      : aiSignals * 8,
    0,
    100
  );

  return {
    mentionVolume,
    redditMentions,
    xMentions,
    youtubeMentions,
    productHuntMentions,
    githubMentions,
    complaintSignals,
    competitorAlternatives,
    recentVelocity,
    aiAutomationFit,
  };
}

export function computeScores(metrics: ComputedMetrics): ScoreEngineOutput {
  const demand = clamp(
    metrics.redditMentions * 6 +
      metrics.xMentions * 5 +
      metrics.youtubeMentions * 4 +
      metrics.complaintSignals * 7 +
      metrics.recentVelocity * 8
  );

  const competition = clamp(
    metrics.productHuntMentions * 9 +
      metrics.githubMentions * 7 +
      metrics.competitorAlternatives * 5
  );

  const disruption = clamp(metrics.aiAutomationFit);

  const virality = clamp(
    metrics.xMentions * 8 + metrics.youtubeMentions * 6 + metrics.recentVelocity * 5
  );

  const monetization = clamp(
    demand * 0.45 + (100 - competition) * 0.35 + disruption * 0.2
  );

  const overallScore = clamp(
    demand * 0.35 +
      (100 - competition) * 0.25 +
      virality * 0.2 +
      monetization * 0.1 +
      disruption * 0.1
  );

  const velocityPct = clamp(metrics.recentVelocity * 12 + metrics.mentionVolume * 2);
  const growthLabel = `+${velocityPct}%`;

  let trendStage: TrendStage = "Emerging";
  if (velocityPct >= 80 && demand >= 75) trendStage = "Breakout";
  else if (velocityPct >= 50 || demand >= 65) trendStage = "Accelerating";
  else if (competition >= 75 && demand < 60) trendStage = "Peaking";

  let competitionLabel: "Low" | "Medium" | "High" = "Medium";
  if (competition < 40) competitionLabel = "Low";
  else if (competition >= 70) competitionLabel = "High";

  const aiConfidence = clamp(
    overallScore * 0.6 + metrics.mentionVolume * 3 + metrics.complaintSignals * 4
  );

  return {
    scores: { demand, competition, virality, monetization, disruption },
    overallScore,
    growthLabel,
    trendStage,
    competitionLabel,
    aiConfidence,
    metrics,
  };
}
