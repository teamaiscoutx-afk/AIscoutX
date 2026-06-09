import type { OpportunityModeData } from "@/lib/database.types";
import type { OpportunityDrawerContent } from "@/lib/dashboard/opportunities";
import type {
  AgencyIntelligence,
  CreatorIntelligence,
  FounderIntelligence,
  ModeIntelligence,
} from "@/lib/dashboard/workspace";

const DEFAULT_INTELLIGENCE: ModeIntelligence = {
  founder: {
    problem: "Market demand is accelerating faster than supply.",
    solution: "Ship a focused MVP that solves one painful workflow.",
    mvp: "Landing page + manual concierge pilot for 10 users.",
    launchTime: "21 days",
  },
  creator: {
    videoTitles: [
      "The opportunity nobody is talking about yet",
      "I validated this niche in 48 hours — here's the data",
      "Why this category is about to explode on short-form",
    ],
    hooks: [
      "This isn't hype — the charts back it up.",
      "If you're building in public, this angle prints engagement.",
    ],
    platform: "YouTube + TikTok",
  },
  agency: {
    serviceOffer: "Done-for-you intelligence sprint + implementation",
    icp: "Founders and creators with existing audience or pipeline",
    retainer: "$2,500–$8,000/mo",
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function pickStringArray(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string[] {
  if (!record) return [];
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeFounder(raw: unknown): FounderIntelligence {
  const r = asRecord(raw);
  const d = DEFAULT_INTELLIGENCE.founder;
  return {
    problem: pickString(r, "problem") ?? d.problem,
    solution: pickString(r, "solution") ?? d.solution,
    mvp: pickString(r, "mvp") ?? d.mvp,
    launchTime: pickString(r, "launchTime", "launch_time") ?? d.launchTime,
  };
}

function normalizeCreator(raw: unknown): CreatorIntelligence {
  const r = asRecord(raw);
  const d = DEFAULT_INTELLIGENCE.creator;
  const titles = pickStringArray(r, "videoTitles", "video_titles", "video_ideas");
  const hooks = pickStringArray(r, "hooks", "script_hooks", "scriptHooks");
  const t0 = titles[0] ?? d.videoTitles[0];
  const t1 = titles[1] ?? d.videoTitles[1];
  const t2 = titles[2] ?? d.videoTitles[2];
  const h0 = hooks[0] ?? d.hooks[0];
  const h1 = hooks[1] ?? d.hooks[1];

  return {
    videoTitles: [t0, t1, t2],
    hooks: [h0, h1],
    platform: pickString(r, "platform", "content_platform") ?? d.platform,
  };
}

function normalizeAgency(raw: unknown): AgencyIntelligence {
  const r = asRecord(raw);
  const d = DEFAULT_INTELLIGENCE.agency;
  return {
    serviceOffer:
      pickString(r, "serviceOffer", "service_offer", "core_offer") ??
      d.serviceOffer,
    icp: pickString(r, "icp", "target_clients", "targetClients") ?? d.icp,
    retainer:
      pickString(r, "retainer", "retainer_price", "recommended_retainer") ??
      d.retainer,
  };
}

export function normalizeIntelligence(raw: unknown): ModeIntelligence {
  const root = asRecord(raw);
  return {
    founder: normalizeFounder(root?.founder),
    creator: normalizeCreator(root?.creator),
    agency: normalizeAgency(root?.agency),
  };
}

function pickDrawerField(
  drawer: Record<string, unknown> | null,
  ...keys: string[]
): string | undefined {
  return pickString(drawer, ...keys);
}

function pickDrawerList(
  drawer: Record<string, unknown> | null,
  ...keys: string[]
): string[] {
  return pickStringArray(drawer, ...keys);
}

function deriveDrawerFromIntelligence(
  intelligence: ModeIntelligence
): OpportunityDrawerContent {
  return {
    whyThisMatters: intelligence.founder.problem,
    recommendedAction: intelligence.founder.solution,
    targetClients: intelligence.agency.icp,
    viralVideoIdeas: intelligence.creator.videoTitles.filter((t) => t.trim()),
  };
}

export function resolveDrawerContent(
  modeData: OpportunityModeData,
  intelligence: ModeIntelligence
): OpportunityDrawerContent {
  const drawerRaw = asRecord(modeData.drawer);
  const derived = deriveDrawerFromIntelligence(intelligence);

  const viralFromDrawer = pickDrawerList(
    drawerRaw,
    "viralVideoIdeas",
    "viral_video_ideas",
    "video_ideas"
  );
  const viralFromCreator = [
    intelligence.creator.videoTitles[0],
    intelligence.creator.videoTitles[1],
    intelligence.creator.videoTitles[2],
  ].filter((t) => t.trim());

  const viralVideoIdeas =
    viralFromDrawer.length > 0 ? viralFromDrawer : viralFromCreator;

  const why = pickDrawerField(
    drawerRaw,
    "whyThisMatters",
    "why_it_matters",
    "whyItMatters"
  );
  const action = pickDrawerField(
    drawerRaw,
    "recommendedAction",
    "recommended_action"
  );
  const clients = pickDrawerField(
    drawerRaw,
    "targetClients",
    "target_clients",
    "best_for",
    "bestFor"
  );

  return {
    whyThisMatters: why?.trim() || derived.whyThisMatters,
    recommendedAction: action?.trim() || derived.recommendedAction,
    targetClients: clients?.trim() || derived.targetClients,
    viralVideoIdeas:
      viralVideoIdeas.length > 0 ? viralVideoIdeas : derived.viralVideoIdeas,
  };
}

export function normalizeModeData(raw: unknown): OpportunityModeData {
  const root = asRecord(raw) ?? {};
  const intelligence = normalizeIntelligence(root.intelligence);

  const modeData: OpportunityModeData = {
    aiConfidence:
      typeof root.aiConfidence === "number"
        ? root.aiConfidence
        : typeof root.ai_confidence === "number"
          ? root.ai_confidence
          : undefined,
    competitionLabel: pickString(root, "competitionLabel", "competition_label"),
    trendStage: pickString(root, "trendStage", "trend_stage") as
      | OpportunityModeData["trendStage"]
      | undefined,
    virality: typeof root.virality === "number" ? root.virality : undefined,
    monetization:
      typeof root.monetization === "number" ? root.monetization : undefined,
    revenuePotential: pickString(
      root,
      "revenuePotential",
      "revenue_potential"
    ),
    sources: pickStringArray(root, "sources"),
    keywords: pickStringArray(root, "keywords"),
    hot: typeof root.hot === "boolean" ? root.hot : undefined,
    intelligence,
    actionPlanMarkdown: pickString(
      root,
      "actionPlanMarkdown",
      "action_plan_markdown"
    ),
    deepDive: root.deepDive as OpportunityModeData["deepDive"],
    disruption:
      typeof root.disruption === "number" ? root.disruption : undefined,
    liveSynthesizedAt: pickString(root, "liveSynthesizedAt", "live_synthesized_at"),
  };

  modeData.drawer = resolveDrawerContent(modeData, intelligence);

  return modeData;
}
