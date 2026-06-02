import type {
  NicheId,
  UserOnboardingProfile,
  WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import { deriveDrawerFromIntelligence } from "@/lib/dashboard/opportunity-mapper";
import {
  mockOpportunities,
  type Opportunity,
} from "@/lib/dashboard/opportunities";

export type NicheFeedData = {
  opportunities: Opportunity[];
  opportunityOfTheDayId: string;
  trendingKeywords: string[];
  viralHooks: string[];
};

function intel(
  niche: string,
  problem: string,
  solution: string,
  mvp: string,
  videoTitles: [string, string, string],
  hooks: [string, string],
  platform: string,
  service: string,
  icp: string,
  retainer: string
): ModeIntelligence {
  return {
    founder: {
      problem,
      solution,
      mvp,
      launchTime: "14 days",
    },
    creator: {
      videoTitles,
      hooks,
      platform,
    },
    agency: {
      serviceOffer: service,
      icp,
      retainer,
    },
  };
}

function opp(
  partial: Omit<Opportunity, "intelligence" | "drawer"> & {
    intelligence: ModeIntelligence;
  }
): Opportunity {
  return {
    ...partial,
    drawer: deriveDrawerFromIntelligence(partial.intelligence),
  };
}

function feed(
  opportunityOfTheDayId: string,
  opportunities: Opportunity[],
  trendingKeywords: string[],
  viralHooks: string[]
): NicheFeedData {
  return {
    opportunityOfTheDayId,
    opportunities,
    trendingKeywords,
    viralHooks,
  };
}

const CREATOR_TECH_AI = feed(
  "cta-1",
  [
    opp({
      id: "cta-1",
      name: "AI Voice Cloning for Creators",
      category: "Tech & AI",
      score: 93,
      aiConfidence: 93,
      growth: "+312%",
      hot: true,
      competitionLabel: "Low",
      trendStage: "Breakout",
      scores: { demand: 94, competition: 52, virality: 91, monetization: 88 },
      revenuePotential: "$3k–$12k/mo",
      sources: ["Reddit", "YouTube", "X"],
      keywords: ["ai voice", "voice clone", "tech ai", "creator tools"],
      intelligence: intel(
        "Tech & AI",
        "Creators need scalable voice content without studio time.",
        "Lightweight voice-clone workflows for short-form channels.",
        "Notion template + 3 demo workflows for TikTok/Reels.",
        [
          "I cloned my voice with AI and 10x'd my output",
          "The AI voice niche creators are sleeping on",
          "Why tech creators are switching to synthetic voice stacks",
        ],
        [
          "Your audience can't tell this was AI—and that's the opportunity.",
          "Tech & AI voice tools are up 300% in search. Here's the angle.",
        ],
        "YouTube + TikTok",
        "Done-for-you AI voice branding for creator clients",
        "Creator agencies with 5–20 talent rosters",
        "$2,500–$6,000/mo"
      ),
    }),
    opp({
      id: "cta-2",
      name: "Autonomous Code Agents",
      category: "Developer Content",
      score: 89,
      aiConfidence: 89,
      growth: "+198%",
      hot: true,
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 90, competition: 61, virality: 85, monetization: 86 },
      revenuePotential: "$2k–$9k/mo",
      sources: ["Reddit", "Hacker News", "YouTube"],
      keywords: ["code agents", "autonomous agents", "ai coding", "devtools"],
      intelligence: intel(
        "Tech & AI",
        "Developers want agents that ship features, not just chat.",
        "Content series reviewing autonomous coding stacks.",
        "Weekly 'agent drop' newsletter for indie hackers.",
        [
          "Autonomous agents just changed indie hacking forever",
          "I let an AI agent build my SaaS for 48 hours—results inside",
          "The code agent stack nobody is documenting yet",
        ],
        [
          "Stop teaching prompts. Teach agent orchestration.",
          "This dev niche is exploding on Reddit right now.",
        ],
        "YouTube + X",
        "AI agent audits for startup engineering teams",
        "Seed-stage startups with 2–10 engineers",
        "$4,000–$10,000/mo"
      ),
    }),
    opp({
      id: "cta-3",
      name: "AI Thumbnail & Hook Lab",
      category: "Creator Tools",
      score: 82,
      aiConfidence: 82,
      growth: "+145%",
      hot: false,
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 84, competition: 64, virality: 88, monetization: 79 },
      revenuePotential: "$800–$4k/mo",
      sources: ["Reddit", "TikTok", "Product Hunt"],
      keywords: ["ai thumbnail", "viral hooks", "ctr optimization"],
      intelligence: intel(
        "Tech & AI",
        "CTR volatility is killing creator growth on tech channels.",
        "AI thumbnail variants + hook scoring dashboard.",
        "Notion + Figma pack for tech reviewers.",
        [
          "This AI thumbnail test doubled my CTR in 7 days",
          "Tech YouTubers: your hooks are outdated (data proof)",
          "I built a hook lab in one weekend—here's the stack",
        ],
        [
          "Your next video's hook is worth more than the edit.",
          "Tech & AI creators are competing on packaging now, not quality.",
        ],
        "YouTube",
        "CTR optimization retainers for tech creators",
        "Tech review channels 50k–500k subs",
        "$1,200–$3,500/mo"
      ),
    }),
    opp({
      id: "cta-4",
      name: "Local LLM Setup Guides",
      category: "Privacy Tech",
      score: 78,
      aiConfidence: 78,
      growth: "+92%",
      competitionLabel: "Low",
      trendStage: "Emerging",
      scores: { demand: 76, competition: 55, virality: 72, monetization: 74 },
      revenuePotential: "$500–$3k/mo",
      sources: ["Reddit", "YouTube"],
      keywords: ["local llm", "privacy ai", "self-hosted ai"],
      intelligence: intel(
        "Tech & AI",
        "Privacy-conscious creators want offline AI stacks.",
        "Tutorial series for local LLM content pipelines.",
        "Downloadable setup scripts + troubleshooting vault.",
        [
          "I run my entire channel stack offline—here's how",
          "Local LLMs are the creator privacy play of 2025",
          "Why tech audiences pay for private AI workflows",
        ],
        [
          "Big tech cloud fatigue is real—lean into it.",
          "This niche has passionate buyers, not tire-kickers.",
        ],
        "YouTube + Newsletter",
        "Private AI stack setup for creators",
        "Tech educators and newsletter operators",
        "$1,500–$4,000/project"
      ),
    }),
    opp({
      id: "cta-5",
      name: "AI News Digest Channels",
      category: "Media",
      score: 75,
      aiConfidence: 75,
      growth: "+67%",
      competitionLabel: "High",
      trendStage: "Emerging",
      scores: { demand: 73, competition: 68, virality: 80, monetization: 70 },
      revenuePotential: "$400–$2.5k/mo",
      sources: ["X", "Reddit", "YouTube"],
      keywords: ["ai news", "tech digest", "daily briefing"],
      intelligence: intel(
        "Tech & AI",
        "Audiences want curated signal, not another AI newsletter.",
        "Daily 90-second AI news format with consistent branding.",
        "Automated research pipeline + human voiceover.",
        [
          "I started an AI news channel in 10 days—metrics inside",
          "The AI digest format beating mainstream tech media",
          "Why short AI news hits are monetizing faster than long form",
        ],
        [
          "Speed beats depth in AI news right now.",
          "Consistency in AI news is the moat—not originality.",
        ],
        "X + YouTube Shorts",
        "Sponsored slots on AI digest channels",
        "B2B AI tools seeking creator distribution",
        "$800–$2,000/placement"
      ),
    }),
  ],
  [
    "ai voice clone",
    "autonomous agents",
    "ai thumbnails",
    "local llm",
    "tech ai news",
    "code copilot",
  ],
  [
    "Nobody is talking about this AI creator niche yet—but the charts say otherwise.",
    "I scanned 10,000 tech posts so you don't have to. Here's what wins in Tech & AI.",
    "If you're a creator in AI, this hook structure is printing views right now.",
  ]
);

const CREATOR_FINANCE = feed(
  "cf-1",
  [
    opp({
      id: "cf-1",
      name: "AI Personal Finance Copilots",
      category: "Finance & Business",
      score: 88,
      aiConfidence: 88,
      growth: "+176%",
      hot: true,
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 89, competition: 60, virality: 82, monetization: 90 },
      revenuePotential: "$2k–$8k/mo",
      sources: ["Reddit", "YouTube", "X"],
      keywords: ["finance ai", "budget copilot", "personal finance"],
      intelligence: intel(
        "Finance",
        "Young professionals want AI-guided money decisions without advisors.",
        "Weekly finance breakdown videos using AI-generated insights.",
        "Template pack: 'AI money audit' for Instagram reels.",
        [
          "I let AI roast my finances for 30 days",
          "The finance niche exploding on business TikTok",
          "Why AI money coaches are replacing spreadsheets",
        ],
        [
          "Money anxiety is the hook—AI is the relief.",
          "Finance creators who add AI angles are 3x-ing watch time.",
        ],
        "TikTok + Instagram",
        "AI finance content systems for influencers",
        "Personal finance creators 100k+ followers",
        "$2,000–$5,000/mo"
      ),
    }),
    opp({
      id: "cf-2",
      name: "Side Hustle Signal Newsletters",
      category: "Business Content",
      score: 84,
      aiConfidence: 84,
      growth: "+134%",
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 86, competition: 58, virality: 79, monetization: 85 },
      revenuePotential: "$1k–$6k/mo",
      sources: ["Reddit", "Product Hunt"],
      keywords: ["side hustle", "business newsletter", "income ideas"],
      intelligence: intel(
        "Finance",
        "Audiences crave vetted side income plays, not guru fluff.",
        "Curated 'hustle of the week' video series.",
        "Beehiiv template + research SOP.",
        [
          "I tested 12 side hustles with AI research—one clear winner",
          "The business newsletter format growing faster than podcasts",
          "Finance creators: stop teaching budgeting, teach opportunity scanning",
        ],
        [
          "Your audience wants income ideas, not inspiration.",
          "Data-backed hustle content builds trust fast in finance.",
        ],
        "YouTube + Newsletter",
        "Newsletter sponsorship bundles",
        "Fintech and education brands",
        "$1,500–$4,500/mo"
      ),
    }),
  ],
  ["ai finance", "side hustle", "investing tips", "business tiktok", "money automation"],
  [
    "The finance angle your audience is searching for—but no one is filming yet.",
    "I turned Reddit finance threads into viral scripts with this AI workflow.",
    "Business creators: this niche has high CPM and low saturation.",
  ]
);

const FOUNDER_B2B_SAAS = feed(
  "fb-1",
  [
    opp({
      id: "fb-1",
      name: "Vertical CRM for Agencies",
      category: "B2B SaaS",
      score: 90,
      aiConfidence: 90,
      growth: "+167%",
      hot: true,
      competitionLabel: "Low",
      trendStage: "Breakout",
      scores: { demand: 91, competition: 48, virality: 70, monetization: 92 },
      revenuePotential: "$8k–$30k/mo",
      sources: ["Reddit", "Product Hunt", "Hacker News"],
      keywords: ["b2b saas", "agency crm", "vertical saas"],
      intelligence: intel(
        "B2B SaaS",
        "Agencies juggle generic CRMs not built for creative workflows.",
        "Lightweight CRM with deliverable tracking and client portals.",
        "MVP for 3 agency workflows: retainers, sprints, approvals.",
        ["", "", ""],
        ["", ""],
        "",
        "Vertical CRM implementation for mid-market agencies",
        "Creative & marketing agencies 10–50 clients",
        "$8,000–$20,000/mo"
      ),
    }),
    opp({
      id: "fb-2",
      name: "AI Onboarding Playbooks SaaS",
      category: "B2B SaaS",
      score: 86,
      aiConfidence: 86,
      growth: "+142%",
      hot: true,
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 88, competition: 55, virality: 68, monetization: 89 },
      revenuePotential: "$5k–$22k/mo",
      sources: ["Reddit", "YouTube"],
      keywords: ["onboarding saas", "plg", "activation"],
      intelligence: intel(
        "B2B SaaS",
        "PLG products leak revenue in the first 7 days of activation.",
        "AI-generated onboarding paths per customer segment.",
        "Wizard + analytics for 2 core activation metrics.",
        ["", "", ""],
        ["", ""],
        "",
        "Onboarding optimization sprints for SaaS founders",
        "B2B SaaS with 500–5k signups/mo",
        "$6,000–$15,000/mo"
      ),
    }),
  ],
  ["b2b saas", "plg growth", "agency tools", "vertical crm", "activation rate"],
  [
    "B2B founders: this pain point is trending on every founder subreddit.",
    "The SaaS wedge with enterprise budgets but indie competition.",
    "If you're building B2B, this GTM angle is still wide open.",
  ]
);

const FOUNDER_AI_TOOLS = feed(
  "fa-1",
  [
    opp({
      id: "fa-1",
      name: "Prompt-to-Product Builders",
      category: "AI Tools",
      score: 92,
      aiConfidence: 92,
      growth: "+221%",
      hot: true,
      competitionLabel: "Low",
      trendStage: "Breakout",
      scores: { demand: 94, competition: 50, virality: 82, monetization: 93 },
      revenuePotential: "$10k–$40k/mo",
      sources: ["Product Hunt", "Reddit", "Hacker News"],
      keywords: ["ai tools", "prompt to product", "ai builder"],
      intelligence: intel(
        "AI Tools",
        "Founders want to ship micro-tools from prompts, not codebases.",
        "No-code layer that outputs deployable micro-SaaS shells.",
        "Single vertical: coaches, real estate, or clinics.",
        ["", "", ""],
        ["", ""],
        "",
        "AI tool MVPs for non-technical founders",
        "First-time SaaS founders in service industries",
        "$12,000–$35,000/project"
      ),
    }),
    opp({
      id: "fa-2",
      name: "AI Compliance Wrappers",
      category: "AI Tools",
      score: 85,
      aiConfidence: 85,
      growth: "+128%",
      competitionLabel: "Medium",
      trendStage: "Accelerating",
      scores: { demand: 87, competition: 62, virality: 65, monetization: 88 },
      revenuePotential: "$6k–$25k/mo",
      sources: ["Reddit", "YouTube"],
      keywords: ["ai compliance", "regulated ai", "enterprise ai"],
      intelligence: intel(
        "AI Tools",
        "Regulated industries need audit trails on AI outputs.",
        "Compliance logging + policy templates for AI features.",
        "HIPAA or finance compliance starter kit.",
        ["", "", ""],
        ["", ""],
        "",
        "Compliance-ready AI feature packs",
        "Health & fintech startups shipping AI",
        "$7,500–$18,000/mo"
      ),
    }),
  ],
  ["ai tools", "prompt saas", "ai wrapper", "compliance ai", "micro saas"],
  [
    "AI tool founders: this is the enterprise wedge hiding in plain sight.",
    "The AI Tools category on Product Hunt is shifting—here's what's next.",
    "Build tools for compliance, not creativity—that's where budgets are.",
  ]
);

const DEFAULT_FEED: NicheFeedData = {
  opportunityOfTheDayId: "4",
  opportunities: mockOpportunities,
  trendingKeywords: [
    "ai receptionist",
    "workflow automation",
    "vertical agents",
    "appointment ai",
  ],
  viralHooks: [
    "Nobody is talking about this niche yet—but the data says it's about to explode.",
    "I scanned 10,000 posts so you don't have to. Here's the opportunity everyone's missing.",
    "This isn't hype. Demand is up 200%+ and competition is still low.",
  ],
};

const FEED_REGISTRY: Record<string, NicheFeedData> = {
  "creator:tech-ai": CREATOR_TECH_AI,
  "creator:finance-business": CREATOR_FINANCE,
  "creator:lifestyle": CREATOR_TECH_AI,
  "creator:coding-design": CREATOR_TECH_AI,
  "founder:b2b-saas": FOUNDER_B2B_SAAS,
  "founder:ai-tools": FOUNDER_AI_TOOLS,
  "founder:ecommerce": FOUNDER_B2B_SAAS,
  "agency:marketing-services": DEFAULT_FEED,
  "agency:ai-implementation": FOUNDER_AI_TOOLS,
  "agency:growth-ops": FOUNDER_B2B_SAAS,
  "solopreneur:digital-products": CREATOR_FINANCE,
  "solopreneur:freelance-ai": FOUNDER_AI_TOOLS,
  "solopreneur:side-hustles": CREATOR_FINANCE,
};

export function getNicheFeedByKey(
  identity: WorkspaceIdentity,
  niche: NicheId
): NicheFeedData {
  const key = `${identity}:${niche}`;
  return FEED_REGISTRY[key] ?? DEFAULT_FEED;
}

export function getNicheFeed(
  profile: UserOnboardingProfile | null
): NicheFeedData {
  if (!profile) return DEFAULT_FEED;
  return getNicheFeedByKey(profile.identity, profile.niche);
}

export function getOpportunityOfTheDayFromFeed(
  feedData: NicheFeedData
): Opportunity {
  return (
    feedData.opportunities.find((o) => o.id === feedData.opportunityOfTheDayId) ??
    feedData.opportunities[0]
  );
}
