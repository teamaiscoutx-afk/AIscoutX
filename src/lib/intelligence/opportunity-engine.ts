import { buildEvidencePromptBlock } from "@/lib/intelligence/copy-engine";
import { synthesizeJson } from "@/lib/intelligence/llm-router";
import { computeMetrics, computeScores } from "@/lib/intelligence/score-engine";
import {
  DISCOVERY_BATCH_BUDGET_MS,
  DISCOVERY_BATCH_DELAY_MS,
  DISCOVERY_CONCURRENCY,
  DISCOVERY_IDEA_TARGET,
  DISCOVERY_LIVE_SEED_CAP,
  DISCOVERY_SEED_TIMEOUT_MS,
} from "@/lib/intelligence/discovery-config";
import { runInChunks, withTimeout } from "@/lib/intelligence/run-in-chunks";
import {
  flattenSnippets,
  isWebSearchConfigured,
  searchAllChannels,
} from "@/lib/intelligence/web-search";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import { getIntelligenceConfig } from "@/lib/intelligence/config";
import type {
  DiscoveryContext,
  LiveOpportunityDraft,
  OpportunityDeepDive,
} from "@/lib/intelligence/types";

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

const OPPORTUNITY_TASK = `You are a Principal Product Architect and Senior SaaS Strategist.
From the web evidence and computed market metrics, generate a hyper-realistic, high-value, production-ready startup execution blueprint as JSON.

STRICT GUIDELINES:
1. DO NOT give generic advice like "React", "Node.js", or "User account management".
2. TECH STACK MUST BE PRODUCTION-READY & SPECIFIC:
   - Frontend: Modern framework (e.g., Next.js 15 App Router, Tailwind CSS, Shadcn UI)
   - Backend: Modern API/Serverless (e.g., Next.js Server Actions, Supabase Edge Functions, Fastify)
   - Database: Real DB (e.g., Supabase Postgres, Prisma ORM, Redis for caching)
   - Specialized APIs: Exact domain APIs (e.g., ElevenLabs API for Voice Cloning, Whisper AI, OpenAI GPT-4o, Stripe/Razorpay SDK)
3. REVENUE & PRICING: Provide exact realistic SaaS tiers (e.g. Starter: $29/mo - 50 mins voice; Agency: $99/mo - Unlimited) instead of vague "$1k-$5k".
4. MVP FEATURES: Detail specific technical capabilities (e.g. "Instant 5-sec voice sample noise reduction & cloning pipeline" instead of "voice cloning").

FORMAT (STRICT JSON ONLY):
{
  "name": "Distinct, catchy brand/product name",
  "category": "Specific market sub-niche",
  "keywords": ["3-6 high-intent search tags"],
  "revenuePotential": "$2,500 - $12,000 / mo (Realistic 100-client MRR target)",
  "intelligence": {
    "founder": { "problem": "Exact core customer pain point", "solution": "Engineered technical solution", "mvp": "3-day build scope", "launchTime": "7-14 days" },
    "creator": { "videoTitles": ["Title 1", "Title 2", "Title 3"], "hooks": ["Hook 1", "Hook 2"], "platform": "Primary channel" },
    "agency": { "serviceOffer": "Done-For-You Retainer package", "icp": "Target business profile", "retainer": "$499/mo per client" }
  },
  "marketGaps": [{ "competitor": "Existing Market Player", "complaint": "Specific verified flaw/user complaint", "source": "Reddit|X|ProductHunt", "url": "verified url" }],
  "solutionBlueprint": {
    "overview": "In-depth architecture and value proposition overview",
    "businessModel": "Freemium + Usage-based Tiered Subscription ($29/$99 per month)",
    "goToMarket": ["Specific GTM Channels & Outreach Strategy"],
    "technicalArchitecture": ["Production Cloud & API Infrastructure Specs"],
    "risks": ["Specific technical or market adoption risks & mitigation"]
  },
  "mvpAnatomy": {
    "coreFlow": [
      "User uploads audio sample & selects target campaign template",
      "AI engine executes voice cloning synthesis & noise removal",
      "Dynamic ad transcript generated & synchronized with cloned audio",
      "Export high-bitrate MP3/WAV with 1-click publishing hook"
    ],
    "techStack": [
      { "layer": "Frontend", "tool": "Next.js 15 (App Router) + Tailwind + Shadcn UI", "rationale": "High SEO, instant server-rendering, and sleek dark UI" },
      { "layer": "Backend & Auth", "tool": "Supabase Postgres + Auth + Row Level Security", "rationale": "Instant real-time database, auth, and secure tenant data isolation" },
      { "layer": "AI Voice Engine", "tool": "ElevenLabs API + OpenAI GPT-4o", "rationale": "Industry standard low-latency voice cloning and script generation" },
      { "layer": "Payments & Subscriptions", "tool": "Stripe / Razorpay SDK + Webhooks", "rationale": "Automated recurring billing, invoice management, and plan gating" }
    ],
    "mustHave": [
      "Secure Auth & User Workspace Isolation",
      "Instant 5-second Audio Voice Sampling & Cloning Pipeline",
      "Dynamic Ad Script Generator with Niche Templates",
      "Export Studio with High-Quality Audio Rendering"
    ],
    "niceToHave": [
      "Multi-lingual Voice Translation & Accent Matching",
      "Direct Integration with Meta & TikTok Ad Managers",
      "Team Collaboration & Shared Brand Workspaces"
    ]
  }
}
Ground every gap in a cited URL from evidence. No invented generic competitors.`;

const DEEP_DIVE_TASK = `Produce an expert, deep-dive JSON update for this opportunity. Use the same schema fields but expand with high-granularity technical specs, precise API recommendations, and actionable step-by-step launch vectors.`;

function sourcesFromSnippets(snippets: { source: string }[]): string[] {
  return Array.from(new Set(snippets.map((s) => s.source)));
}

function normalizeCoreFlow(flow: string[]): [string, string, string, string] {
  const padded = [...flow];
  while (padded.length < 4) padded.push(`Step ${padded.length + 1}: Define execution workflow`);
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
    DISCOVERY_LIVE_SEED_CAP
  );

  if (!unique.length) return [];

  try {
    const results = await runInChunks(
      unique,
      DISCOVERY_CONCURRENCY,
      async (seed) => {
        try {
          const draft = await withTimeout(
            discoverLiveOpportunity(seed, context).catch((err) => {
              console.error(`[discoverLiveOpportunity] seed="${seed}"`, err);
              return null;
            }),
            DISCOVERY_SEED_TIMEOUT_MS,
            null as LiveOpportunityDraft | null
          );
          if (!draft) {
            console.warn(`[discoverLiveOpportunity] seed="${seed}" timed out or failed`);
          }
          return draft;
        } catch (err) {
          console.error(`[discoverLiveOpportunity] seed="${seed}"`, err);
          return null;
        }
      },
      {
        delayBetweenBatchesMs: DISCOVERY_BATCH_DELAY_MS,
        budgetMs: DISCOVERY_BATCH_BUDGET_MS,
      }
    );

    const deduped: LiveOpportunityDraft[] = [];
    const seen = new Set<string>();
    for (const draft of results) {
      if (!draft) continue;
      const key = draft.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(draft);
    }

    return deduped.slice(0, DISCOVERY_IDEA_TARGET);
  } catch (err) {
    console.error("[discoverOpportunityBatch] live batch failed", err);
    return [];
  }
}