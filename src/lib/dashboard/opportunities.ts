import { deriveDrawerFromIntelligence } from "@/lib/dashboard/opportunity-mapper";
import { searchOpportunities } from "@/lib/dashboard/search";
import type { OpportunityDeepDive } from "@/lib/intelligence/types";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";

export type { OpportunityDeepDive, MarketGap, MvpAnatomy, SolutionBlueprint } from "@/lib/intelligence/types";

export type { WorkspaceMode } from "@/lib/dashboard/workspace";

export type ScoreBreakdown = {
  demand: number;
  competition: number;
  virality: number;
  monetization: number;
  disruption?: number;
};

export type TrendStage = "Emerging" | "Accelerating" | "Breakout" | "Peaking";

/** Unified drawer narrative — maps from DB mode_data.drawer or derived intelligence */
export type OpportunityDrawerContent = {
  whyThisMatters: string;
  recommendedAction: string;
  targetClients: string;
  viralVideoIdeas: string[];
};

export type Opportunity = {
  id: string;
  name: string;
  category: string;
  score: number;
  aiConfidence: number;
  growth: string;
  hot?: boolean;
  competitionLabel: string;
  trendStage: TrendStage;
  scores: ScoreBreakdown;
  revenuePotential: string;
  sources: string[];
  keywords: string[];
  intelligence: ModeIntelligence;
  drawer: OpportunityDrawerContent;
  deepDive?: OpportunityDeepDive;
  /** Set when loaded from Supabase for workspace/niche filtering */
  workspace?: import("@/lib/dashboard/onboarding").WorkspaceIdentity;
  niche?: import("@/lib/dashboard/onboarding").NicheId;
};

export const OPPORTUNITY_OF_THE_DAY_ID = "4";

const mockOpportunitiesData: Omit<Opportunity, "drawer">[] = [
  {
    id: "1",
    name: "AI Workflow Automation",
    category: "B2B SaaS",
    score: 87,
    aiConfidence: 87,
    growth: "+124%",
    hot: true,
    competitionLabel: "Medium",
    trendStage: "Accelerating",
    scores: { demand: 92, competition: 58, virality: 76, monetization: 88 },
    revenuePotential: "$2k–$8k/mo",
    sources: ["Reddit", "X", "YouTube"],
    keywords: ["workflow automation", "b2b saas", "automation", "ai workflow"],
    intelligence: {
      founder: {
        problem: "SMBs lose 10+ hours/week on manual handoffs between tools.",
        solution: "No-code workflow packs that connect CRM, email, and AI steps.",
        mvp: "3 pre-built automations for agencies (lead nurture, onboarding, reporting).",
        launchTime: "14 days",
      },
      creator: {
        videoTitles: [
          "I automated my entire client onboarding in 1 afternoon",
          "The AI workflow stack nobody is teaching yet",
          "Stop doing busywork—this B2B automation niche is wide open",
        ],
        hooks: [
          "Your competitors are still copying Zapier templates from 2022…",
          "This workflow niche has 124% demand growth and almost no creators covering it.",
        ],
        platform: "YouTube + LinkedIn",
      },
      agency: {
        serviceOffer: "Done-for-you AI workflow audit + 3 custom automations",
        icp: "Marketing agencies with 5–25 clients using HubSpot or Notion",
        retainer: "$2,500–$6,000/mo",
      },
    },
  },
  {
    id: "2",
    name: "Micro-SaaS for Creators",
    category: "Creator Tools",
    score: 79,
    aiConfidence: 79,
    growth: "+89%",
    competitionLabel: "Medium",
    trendStage: "Emerging",
    scores: { demand: 78, competition: 65, virality: 82, monetization: 74 },
    revenuePotential: "$500–$5k/mo",
    sources: ["Reddit", "X", "TikTok"],
    keywords: ["creator", "micro-saas", "creator copilot", "content"],
    intelligence: {
      founder: {
        problem: "Creators can't see which content angles drive revenue until it's too late.",
        solution: "Lightweight analytics + idea scoring tied to platform trends.",
        mvp: "Chrome extension + weekly niche report for one platform (TikTok first).",
        launchTime: "21 days",
      },
      creator: {
        videoTitles: [
          "The creator tool gap that's printing money right now",
          "I built a $29/mo tool creators actually asked for",
          "Why micro-SaaS beats brand deals in 2025",
        ],
        hooks: [
          "Creators don't need another course—they need this one dashboard.",
          "89% growth in searches for creator ops tools. Here's the angle.",
        ],
        platform: "TikTok + Instagram",
      },
      agency: {
        serviceOffer: "Creator intelligence retainer: trends, hooks, and offer positioning",
        icp: "Creator management agencies with 10+ mid-tier clients",
        retainer: "$1,500–$4,000/mo",
      },
    },
  },
  {
    id: "3",
    name: "Vertical AI Agents",
    category: "Infrastructure",
    score: 92,
    aiConfidence: 92,
    growth: "+201%",
    hot: true,
    competitionLabel: "Low",
    trendStage: "Breakout",
    scores: { demand: 95, competition: 42, virality: 88, monetization: 91 },
    revenuePotential: "$5k–$25k/mo",
    sources: ["Reddit", "YouTube", "Hacker News"],
    keywords: ["vertical agents", "ai agent", "infrastructure", "vertical ai"],
    intelligence: {
      founder: {
        problem: "General chatbots fail compliance and context in regulated verticals.",
        solution: "Vertical agents trained on industry workflows and guardrails.",
        mvp: "One vertical agent (dental or legal intake) with booking + FAQ.",
        launchTime: "30 days",
      },
      creator: {
        videoTitles: [
          "Vertical AI agents will replace generic ChatGPT wrappers",
          "I found a 201% growth niche before the SaaS bros arrived",
          "Build this agent once, sell it to 50 local businesses",
        ],
        hooks: [
          "Everyone's building horizontal AI. The money is vertical.",
          "Low competition + breakout demand = the perfect storm.",
        ],
        platform: "YouTube + X",
      },
      agency: {
        serviceOffer: "Vertical AI agent deployment + monthly optimization",
        icp: "B2B agencies serving healthcare, legal, or home services",
        retainer: "$5,000–$12,000/mo",
      },
    },
  },
  {
    id: "4",
    name: "AI Appointment Automation",
    category: "Local Services",
    score: 91,
    aiConfidence: 91,
    growth: "+287%",
    hot: true,
    competitionLabel: "Low",
    trendStage: "Breakout",
    scores: { demand: 92, competition: 61, virality: 84, monetization: 90 },
    revenuePotential: "$2k–$10k/mo",
    sources: ["Reddit", "YouTube", "Product Hunt"],
    keywords: [
      "ai receptionist",
      "appointment ai",
      "ai voice agent",
      "local services",
      "booking",
    ],
    intelligence: {
      founder: {
        problem: "Local businesses miss 30%+ of leads due to slow follow-up and manual booking.",
        solution: "AI receptionist that books, reminds, and re-engages via SMS.",
        mvp: "Single-vertical setup kit (salons or clinics) with calendar + payment link.",
        launchTime: "14 days",
      },
      creator: {
        videoTitles: [
          "Local businesses will pay $500/mo for this AI setup",
          "The appointment AI niche is up 287%—here's how to package it",
          "I sold AI booking to 3 salons in one week (copy this)",
        ],
        hooks: [
          "Nobody is talking about this AI niche yet—but the data says it's about to explode.",
          "Low competition local AI = the easiest high-ticket offer right now.",
        ],
        platform: "YouTube + Instagram",
      },
      agency: {
        serviceOffer: "AI appointment automation setup + support for local SMBs",
        icp: "Agencies serving dental, med-spa, HVAC, or salon clients",
        retainer: "$1,000–$3,500/mo per client bundle",
      },
    },
  },
  {
    id: "5",
    name: "No-Code AI Wrappers",
    category: "Developer Tools",
    score: 74,
    aiConfidence: 74,
    growth: "+56%",
    competitionLabel: "High",
    trendStage: "Peaking",
    scores: { demand: 70, competition: 78, virality: 68, monetization: 72 },
    revenuePotential: "$300–$3k/mo",
    sources: ["Product Hunt", "Reddit", "GitHub"],
    keywords: ["no-code", "ai wrapper", "developer tools", "starter kit"],
    intelligence: {
      founder: {
        problem: "Indie hackers waste weeks wiring the same API + UI boilerplate.",
        solution: "Starter kits with auth, billing, and one differentiated AI feature.",
        mvp: "One use-case kit (PDF chat, voice notes, or image batch) on a template.",
        launchTime: "10 days",
      },
      creator: {
        videoTitles: [
          "Stop building from scratch—sell AI wrapper kits instead",
          "The no-code AI play that's still working (barely)",
          "How I'd launch an AI tool in a weekend in 2025",
        ],
        hooks: [
          "High competition—but this positioning still converts on Product Hunt.",
          "Wrapper fatigue is real. Here's the angle that still works.",
        ],
        platform: "X + YouTube",
      },
      agency: {
        serviceOffer: "White-label AI wrapper builds for client products",
        icp: "Digital agencies launching MVP apps for startup clients",
        retainer: "$3,000–$8,000 per build",
      },
    },
  },
];

export const mockOpportunities: Opportunity[] = mockOpportunitiesData.map(
  (opportunity) => ({
    ...opportunity,
    drawer: deriveDrawerFromIntelligence(opportunity.intelligence),
  })
);

export const trendingKeywords = [
  "AI receptionist",
  "AI voice agent",
  "workflow automation",
  "appointment AI",
  "vertical agents",
  "creator copilot",
];

export const viralHooks = [
  "Nobody is talking about this AI niche yet—but the data says it's about to explode.",
  "I scanned 10,000 posts so you don't have to. Here's the opportunity everyone's missing.",
  "This isn't hype. Demand is up 200%+ and competition is still low.",
];

export function getOpportunityById(id: string): Opportunity | undefined {
  return mockOpportunities.find((o) => o.id === id);
}

export function getOpportunityOfTheDay(): Opportunity {
  return (
    getOpportunityById(OPPORTUNITY_OF_THE_DAY_ID) ?? mockOpportunities[0]
  );
}

/** Token-based fuzzy search across name, category, and keyword tags */
export function filterOpportunitiesBySearch(
  opportunities: Opportunity[],
  searchQuery: string
): Opportunity[] {
  return searchOpportunities(opportunities, searchQuery);
}

/** Client-side filter: match keyword against tags, name, and category */
export function filterOpportunitiesByKeyword(
  opportunities: Opportunity[],
  keyword: string | null
): Opportunity[] {
  if (!keyword?.trim()) return opportunities;

  const query = keyword.trim().toLowerCase();

  return opportunities.filter((opportunity) => {
    const haystack = [
      opportunity.name,
      opportunity.category,
      ...opportunity.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return (
      haystack.includes(query) ||
      opportunity.keywords.some(
        (tag) => tag.includes(query) || query.includes(tag)
      )
    );
  });
}

export function getTrendStageColor(stage: TrendStage): string {
  switch (stage) {
    case "Breakout":
      return "border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a]";
    case "Accelerating":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "Emerging":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "Peaking":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
  }
}
