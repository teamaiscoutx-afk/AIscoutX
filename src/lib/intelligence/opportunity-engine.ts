import { buildEvidencePromptBlock } from "@/lib/intelligence/copy-engine";
import { synthesizeJson } from "@/lib/intelligence/llm-router";
import { computeMetrics, computeScores } from "@/lib/intelligence/score-engine";
import type {
  DiscoveryContext,
  LiveOpportunityDraft,
  OpportunityDeepDive,
} from "@/lib/intelligence/types";
import {
  flattenSnippets,
  isWebSearchConfigured,
  searchAllChannels,
} from "@/lib/intelligence/web-search";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import { getIntelligenceConfig } from "@/lib/intelligence/config";

type LlmOpportunityCard = {
  name: string;
  category: string;
  keywords: string[];
  revenuePotential: string;
  intelligence: ModeIntelligence;
  marketGaps: {
    competitor: string;
    complaint: string;
    source: string;
    url: string;
  }[];
  solutionBlueprint: {
    overview: string;
    businessModel: string;
    goToMarket: string[];
    technicalArchitecture: string[];
    risks: string[];
  };
  mvpAnatomy: {
    coreFlow: string[];
    techStack: { layer: string; tool: string; rationale: string }[];
    mustHave: string[];
    niceToHave: string[];
  };
};

const OPPORTUNITY_TASK = `From the web evidence and computed metrics, produce ONE startup opportunity card as JSON:
{
  "name": "short product category name",
  "category": "market segment",
  "keywords": ["3-6 search tags"],
  "revenuePotential": "honest range like $1k-$5k/mo based on category norms",
  "intelligence": {
    "founder": { "problem": "", "solution": "", "mvp": "", "launchTime": "days count" },
    "creator": { "videoTitles": ["", "", ""], "hooks": ["", ""], "platform": "" },
    "agency": { "serviceOffer": "", "icp": "", "retainer": "" }
  },
  "marketGaps": [{ "competitor": "", "complaint": "from reviews/posts", "source": "Reddit|X|etc", "url": "" }],
  "solutionBlueprint": {
    "overview": "production-grade solution summary",
    "businessModel": "pricing + who pays",
    "goToMarket": ["3-5 concrete channels"],
    "technicalArchitecture": ["3-6 stack decisions"],
    "risks": ["2-4 real risks"]
  },
  "mvpAnatomy": {
    "coreFlow": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "techStack": [{ "layer": "", "tool": "open-source or API name", "rationale": "" }],
    "mustHave": ["core workflow items only"],
    "niceToHave": ["secondary extensions"]
  }
}
Ground every gap in a cited URL from evidence. No invented competitors.`;

const DEEP_DIVE_TASK = `Produce a deep-dive JSON update for this opportunity. Same schema fields as opportunity card but more granular execution detail for marketGaps, solutionBlueprint, and mvpAnatomy.`;

function sourcesFromSnippets(snippets: { source: string }[]): string[] {
  return Array.from(new Set(snippets.map((s) => s.source)));
}

function normalizeCoreFlow(flow: string[]): [string, string, string, string] {
  const padded = [...flow];
  while (padded.length < 4) padded.push(`Step ${padded.length + 1}: define workflow`);
  return padded.slice(0, 4) as [string, string, string, string];
}

function toDeepDive(
  card: LlmOpportunityCard,
  evidenceUrls: string[]
): OpportunityDeepDive {
  return {
    marketGaps: card.marketGaps.slice(0, 6),
    solutionBlueprint: card.solutionBlueprint,
    mvpAnatomy: {
      coreFlow: normalizeCoreFlow(card.mvpAnatomy.coreFlow),
      techStack: card.mvpAnatomy.techStack.slice(0, 8),
      mustHave: card.mvpAnatomy.mustHave,
      niceToHave: card.mvpAnatomy.niceToHave,
    },
    evidenceUrls,
    synthesizedAt: new Date().toISOString(),
  };
}

export async function discoverLiveOpportunity(
  seed: string,
  context?: Partial<DiscoveryContext>
): Promise<LiveOpportunityDraft> {
  const config = getIntelligenceConfig();
  if (!config.hasWebSearch || !config.hasLlm) {
    throw new Error(
      "Intelligence engine requires TAVILY_API_KEY or SERPER_API_KEY or PERPLEXITY_API_KEY plus OPENAI_API_KEY or ANTHROPIC_API_KEY."
    );
  }

  const query = seed.trim();
  const channelResults = await searchAllChannels(query);
  const snippets = flattenSnippets(channelResults);
  const metrics = computeMetrics(channelResults, snippets);
  const scores = computeScores(metrics);

  const evidenceBlock = buildEvidencePromptBlock({
    query,
    metrics: {
      demandScore: scores.scores.demand,
      competitionScore: scores.scores.competition,
      disruptionScore: scores.scores.disruption,
      mentionVolume: metrics.mentionVolume,
      complaintSignals: metrics.complaintSignals,
      recentVelocity: metrics.recentVelocity,
      workspace: context?.workspace ?? "founder",
      niche: context?.nicheLabel ?? context?.niche ?? "general",
    },
    snippets,
  });

  const card = await synthesizeJson<LlmOpportunityCard>(
    OPPORTUNITY_TASK,
    evidenceBlock
  );

  const evidenceUrls = snippets.map((s) => s.url).slice(0, 12);

  return {
    name: card.name,
    category: card.category,
    keywords: card.keywords,
    sources: sourcesFromSnippets(snippets),
    revenuePotential: card.revenuePotential,
    intelligence: card.intelligence,
    deepDive: toDeepDive(card, evidenceUrls),
    scores,
  };
}

export async function refreshOpportunityDeepDive(
  seed: string,
  existing?: OpportunityDeepDive
): Promise<OpportunityDeepDive> {
  if (!isWebSearchConfigured() || !getIntelligenceConfig().hasLlm) {
    if (existing) return existing;
    throw new Error("Intelligence APIs not configured for deep-dive refresh.");
  }

  const channelResults = await searchAllChannels(`${seed} complaints alternatives reviews`);
  const snippets = flattenSnippets(channelResults);
  const metrics = computeMetrics(channelResults, snippets);
  const scores = computeScores(metrics);

  const evidenceBlock = buildEvidencePromptBlock({
    query: seed,
    metrics: {
      demandScore: scores.scores.demand,
      competitionScore: scores.scores.competition,
      disruptionScore: scores.scores.disruption,
      mentionVolume: metrics.mentionVolume,
    },
    snippets,
  });

  const card = await synthesizeJson<LlmOpportunityCard>(
    DEEP_DIVE_TASK,
    evidenceBlock
  );

  return toDeepDive(card, snippets.map((s) => s.url).slice(0, 12));
}

export async function discoverOpportunityBatch(
  seeds: string[],
  context?: Partial<DiscoveryContext>
): Promise<LiveOpportunityDraft[]> {
  const unique = Array.from(new Set(seeds.map((s) => s.trim()).filter(Boolean))).slice(
    0,
    3
  );

  const settled = await Promise.all(
    unique.map(async (seed) => {
      try {
        return await discoverLiveOpportunity(seed, context);
      } catch (err) {
        console.error(`[discoverLiveOpportunity] seed="${seed}"`, err);
        return null;
      }
    })
  );

  const results = settled.filter((d): d is LiveOpportunityDraft => d !== null);

  if (!results.length && unique.length) {
    throw new Error(
      "Live discovery failed for all niche seeds. Check Tavily and OpenAI keys, then restart the dev server."
    );
  }

  return results;
}
