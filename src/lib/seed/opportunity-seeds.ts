import { deriveDrawerFromIntelligence } from "@/lib/dashboard/opportunity-mapper";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import type { OpportunityDeepDive } from "@/lib/intelligence/types";

/**
 * Six ultra-premium global discovery signals for the shared `opportunities` feed.
 * Category is NEVER `venture-pack` — that category is reserved for user blueprints.
 * Rows omit workspace/niche so every new user sees the full catalog immediately.
 */
const GLOBAL_DISCOVERY_SEEDS: Omit<Opportunity, "drawer">[] = [
  {
    id: "seed-ai-workflow-copilot",
    name: "AI Workflow Copilot for SMB Ops",
    category: "B2B SaaS",
    score: 91,
    aiConfidence: 91,
    growth: "+142%",
    hot: true,
    competitionLabel: "Medium",
    trendStage: "Breakout",
    scores: {
      demand: 94,
      competition: 52,
      virality: 81,
      monetization: 89,
      disruption: 86,
    },
    revenuePotential: "$3k–$12k/mo",
    sources: ["Reddit", "X", "Product Hunt"],
    keywords: [
      "workflow automation",
      "ai copilot",
      "b2b saas",
      "operations",
      "zapier alternative",
    ],
    intelligence: buildIntelligence({
      problem:
        "SMB operators still copy data between five tools and lose 12+ hours weekly on status updates.",
      solution:
        "A vertical AI copilot that watches Slack + CRM events and drafts the next action with one-click approve.",
      mvp: "3 workflow templates (lead handoff, client onboarding, weekly reporting) with Gmail + Notion connectors.",
      launchTime: "14 days",
      videoTitles: [
        "I replaced 6 hours of ops busywork with one AI copilot",
        "The B2B automation gap nobody is building for yet",
        "Why SMB ops is the next $1B AI wedge",
      ],
      hooks: [
        "Your stack is connected — your team still runs on manual copy-paste.",
        "142% demand growth with almost no purpose-built SMB copilots.",
      ],
      serviceOffer: "Ops automation sprint: audit + 3 live workflows in 10 days",
      icp: "Agencies and SaaS teams with 5–30 employees on Notion or HubSpot",
      retainer: "$4,500–$9,000/mo",
    }),
    deepDive: buildDeepDive(
      "AI Workflow Copilot for SMB Ops",
      "Notion AI",
      "Great for docs, weak on cross-tool triggers and approval flows."
    ),
  },
  {
    id: "seed-vertical-ai-receptionist",
    name: "Vertical AI Receptionist (Clinics & Salons)",
    category: "Vertical SaaS",
    score: 88,
    aiConfidence: 88,
    growth: "+118%",
    hot: true,
    competitionLabel: "Low",
    trendStage: "Accelerating",
    scores: {
      demand: 90,
      competition: 38,
      virality: 74,
      monetization: 92,
      disruption: 84,
    },
    revenuePotential: "$5k–$25k/mo",
    sources: ["Reddit", "Google", "YouTube"],
    keywords: [
      "ai receptionist",
      "appointment booking",
      "vertical saas",
      "healthcare",
      "salon software",
    ],
    intelligence: buildIntelligence({
      problem:
        "Clinics and salons miss 30% of inbound calls; front-desk staff cost $45k+/year per location.",
      solution:
        "Voice + SMS agent trained on one vertical's FAQs, booking rules, and insurance intake scripts.",
      mvp: "Single-vertical demo (dental OR med-spa) with Calendly + Twilio voice in under 2 weeks.",
      launchTime: "21 days",
      videoTitles: [
        "We built an AI receptionist that books $18k/mo for a dental clinic",
        "Why vertical beats horizontal in voice AI right now",
        "The appointment gap costing local businesses six figures",
      ],
      hooks: [
        "Missed calls aren't lost leads — they're lost surgeries.",
        "118% search velocity with fragmented incumbents charging enterprise prices.",
      ],
      serviceOffer: "White-label AI receptionist install + 30-day tuning",
      icp: "Multi-location clinics, med-spas, and premium salons in the US",
      retainer: "$6,000–$15,000/mo per location cluster",
    }),
    deepDive: buildDeepDive(
      "Vertical AI Receptionist",
      "Ruby Receptionist",
      "Human-powered, expensive, and doesn't integrate with modern booking stacks."
    ),
  },
  {
    id: "seed-devtool-ai-pr-reviewer",
    name: "AI PR Reviewer for Engineering Teams",
    category: "Developer Tools",
    score: 85,
    aiConfidence: 85,
    growth: "+96%",
    hot: false,
    competitionLabel: "Medium",
    trendStage: "Accelerating",
    scores: {
      demand: 86,
      competition: 61,
      virality: 79,
      monetization: 83,
      disruption: 88,
    },
    revenuePotential: "$2k–$15k/mo",
    sources: ["GitHub", "X", "Reddit"],
    keywords: [
      "ai code review",
      "developer tools",
      "github app",
      "engineering productivity",
      "devops",
    ],
    intelligence: buildIntelligence({
      problem:
        "Senior engineers spend 6–8 hours/week on shallow PR reviews while security issues slip through.",
      solution:
        "GitHub App that scores diffs for security, performance, and style — with fix suggestions inline.",
      mvp: "GitHub App + Slack digest for repos under 50 contributors; one-click apply for safe patches.",
      launchTime: "28 days",
      videoTitles: [
        "Our AI PR bot caught what senior devs missed for 3 months",
        "The devtool wedge with 96% GitHub mention growth",
        "Why code review is the next AI agent battleground",
      ],
      hooks: [
        "Your CI passes. Your PR still ships a SQL injection.",
        "Teams pay for Copilot — nobody owns the review layer yet.",
      ],
      serviceOffer: "Enterprise pilot: custom rulesets + SOC2-friendly deployment",
      icp: "Seed–Series B startups with 10–80 engineers on GitHub Cloud",
      retainer: "$8,000–$20,000/mo",
    }),
    deepDive: buildDeepDive(
      "AI PR Reviewer",
      "GitHub Copilot",
      "Strong on autocomplete, no structured review scoring or team policy enforcement."
    ),
  },
  {
    id: "seed-creator-revenue-dashboard",
    name: "Creator Revenue Attribution Dashboard",
    category: "Creator Economy",
    score: 82,
    aiConfidence: 82,
    growth: "+87%",
    hot: true,
    competitionLabel: "Low",
    trendStage: "Emerging",
    scores: {
      demand: 84,
      competition: 44,
      virality: 91,
      monetization: 78,
      disruption: 72,
    },
    revenuePotential: "$500–$8k/mo",
    sources: ["X", "TikTok", "YouTube"],
    keywords: [
      "creator analytics",
      "revenue attribution",
      "micro saas",
      "content business",
      "stripe for creators",
    ],
    intelligence: buildIntelligence({
      problem:
        "Creators can't tie a viral post to actual revenue — brand deals and affiliates live in separate dashboards.",
      solution:
        "Unified view: link-in-bio clicks → Stripe/ Gumroad conversions → content source tags.",
      mvp: "Chrome extension + weekly email for one platform (YouTube or TikTok) with UTM auto-tagging.",
      launchTime: "18 days",
      videoTitles: [
        "I finally know which video made me $4,200 last month",
        "The creator SaaS gap bigger than editing tools",
        "Stop guessing — attribute revenue to the hook that converted",
      ],
      hooks: [
        "Views are vanity if you can't name the post that paid rent.",
        "87% growth in creator-business tooling with no clear attribution winner.",
      ],
      serviceOffer: "Creator ops setup: analytics stack + sponsor reporting templates",
      icp: "Creators doing $5k–$50k/mo across courses, affiliates, and sponsorships",
      retainer: "$1,500–$4,000/mo",
    }),
    deepDive: buildDeepDive(
      "Creator Revenue Dashboard",
      "Beacons / Linktree",
      "Link aggregation only — zero revenue attribution or content-level ROI."
    ),
  },
  {
    id: "seed-fintech-ai-cashflow",
    name: "AI Cash-Flow Forecaster for Freelancers",
    category: "FinTech SaaS",
    score: 80,
    aiConfidence: 80,
    growth: "+74%",
    hot: false,
    competitionLabel: "Medium",
    trendStage: "Emerging",
    scores: {
      demand: 79,
      competition: 58,
      virality: 68,
      monetization: 85,
      disruption: 76,
    },
    revenuePotential: "$1k–$6k/mo",
    sources: ["Reddit", "Google", "LinkedIn"],
    keywords: [
      "cash flow",
      "freelancer finance",
      "ai forecasting",
      "fintech",
      "invoicing",
    ],
    intelligence: buildIntelligence({
      problem:
        "Freelancers and agencies guess runway from bank balance — invoice delays kill hiring decisions.",
      solution:
        "Plaid + Stripe ingest that predicts 90-day cash position and flags at-risk clients.",
      mvp: "Read-only bank link + manual invoice upload + weekly forecast email.",
      launchTime: "21 days",
      videoTitles: [
        "How I stopped panic-checking my bank account every Monday",
        "The freelancer fintech niche banks ignore",
        "AI forecasting without a CFO — build this in a weekend",
      ],
      hooks: [
        "Your P&L is a spreadsheet. Your runway should not be.",
        "74% YoY growth in solo-business finance searches.",
      ],
      serviceOffer: "Fractional CFO lite: forecast model + client risk scoring",
      icp: "Agencies and consultants billing $10k–$80k/mo with 5–20 active clients",
      retainer: "$2,000–$5,500/mo",
    }),
    deepDive: buildDeepDive(
      "AI Cash-Flow Forecaster",
      "QuickBooks",
      "Backward-looking bookkeeping — no probabilistic forecast or client risk scoring."
    ),
  },
  {
    id: "seed-compliance-ai-docs",
    name: "Compliance Doc Generator for Startups",
    category: "RegTech SaaS",
    score: 78,
    aiConfidence: 78,
    growth: "+68%",
    hot: false,
    competitionLabel: "Low",
    trendStage: "Emerging",
    scores: {
      demand: 76,
      competition: 35,
      virality: 62,
      monetization: 88,
      disruption: 80,
    },
    revenuePotential: "$2k–$10k/mo",
    sources: ["Product Hunt", "LinkedIn", "Reddit"],
    keywords: [
      "compliance",
      "soc2",
      "startup legal",
      "privacy policy",
      "regtech",
    ],
    intelligence: buildIntelligence({
      problem:
        "Early startups delay enterprise deals because privacy policies and SOC2-lite docs take weeks of lawyer time.",
      solution:
        "Questionnaire → generated policy pack (privacy, DPA, security overview) with jurisdiction templates.",
      mvp: "US + EU privacy policy generator + exportable security one-pager for sales.",
      launchTime: "14 days",
      videoTitles: [
        "We closed our first enterprise deal after fixing docs in one afternoon",
        "The boring SaaS category that prints retainers",
        "Why RegTech for startups is wide open in 2025",
      ],
      hooks: [
        "Your product works. Legal docs are why the deal stalled.",
        "68% growth in startup compliance searches — few self-serve tools exist.",
      ],
      serviceOffer: "Compliance sprint: doc pack + sales security questionnaire prep",
      icp: "B2B SaaS founders selling to mid-market with first SOC2 pressure",
      retainer: "$3,500–$12,000/mo",
    }),
    deepDive: buildDeepDive(
      "Compliance Doc Generator",
      "Termly",
      "Generic templates — no startup-specific security narrative or sales-ready one-pager."
    ),
  },
];

type IntelligenceInput = {
  problem: string;
  solution: string;
  mvp: string;
  launchTime: string;
  videoTitles: [string, string, string];
  hooks: [string, string];
  serviceOffer: string;
  icp: string;
  retainer: string;
};

function buildIntelligence(input: IntelligenceInput): ModeIntelligence {
  return {
    founder: {
      problem: input.problem,
      solution: input.solution,
      mvp: input.mvp,
      launchTime: input.launchTime,
    },
    creator: {
      videoTitles: input.videoTitles,
      hooks: input.hooks,
      platform: "YouTube + LinkedIn",
    },
    agency: {
      serviceOffer: input.serviceOffer,
      icp: input.icp,
      retainer: input.retainer,
    },
  };
}

function buildDeepDive(
  name: string,
  competitor: string,
  complaint: string
): OpportunityDeepDive {
  const now = new Date().toISOString();
  return {
    marketGaps: [
      {
        competitor,
        complaint,
        source: "Community reviews",
        url: "https://reddit.com",
      },
    ],
    solutionBlueprint: {
      overview: `${name} wins by shipping a narrow workflow in under 30 days with clear ROI metrics.`,
      businessModel: "Freemium discovery → Pro at ₹799–$49/mo → team tier for agencies.",
      goToMarket: [
        "Post build-in-public breakdown in 2 niche subreddits",
        "Offer 10 free teardown calls to ideal ICP profiles",
        "Launch on Product Hunt with a founder story and live demo",
      ],
      technicalArchitecture: [
        "Next.js 14 + Supabase with RLS for user data isolation",
        "Stripe subscriptions with webhook-driven Pro unlock",
        "Vercel AI SDK for streaming intelligence features",
      ],
      risks: [
        "Scope creep — keep v1 to one vertical or one workflow",
        "Over-reliance on third-party APIs — cache and mock fallbacks required",
      ],
    },
    mvpAnatomy: {
      coreFlow: [
        "User connects core tool (CRM, bank, or GitHub)",
        "System ingests signals and surfaces one prioritized action",
        "User approves or edits the recommendation",
        "Outcome logged — weekly digest shows ROI",
      ],
      techStack: [
        {
          layer: "Frontend",
          tool: "Next.js + Tailwind",
          rationale: "Fast SSR dashboard with premium dark UI.",
        },
        {
          layer: "Backend",
          tool: "Supabase Postgres",
          rationale: "Auth, RLS, and JSON mode_data in one stack.",
        },
        {
          layer: "AI",
          tool: "OpenAI / Anthropic via Vercel AI SDK",
          rationale: "Streaming UX with provider fallback.",
        },
      ],
      mustHave: [
        "Guided onboarding under 2 minutes",
        "One killer workflow that saves measurable time",
        "Stripe checkout for Pro upgrade",
      ],
      niceToHave: [
        "Email alerts on signal changes",
        "Export to PDF for client deliverables",
      ],
    },
    evidenceUrls: ["https://reddit.com", "https://producthunt.com"],
    synthesizedAt: now,
  };
}

/** Premium global discovery catalog — exactly 6 items for Stripe reviewer feeds. */
export function getSeedOpportunities(): Opportunity[] {
  return GLOBAL_DISCOVERY_SEEDS.map((seed) => ({
    ...seed,
    drawer: deriveDrawerFromIntelligence(seed.intelligence),
  }));
}

/** Category used for user-generated blueprint packs — never used by this seeder. */
export const USER_BLUEPRINT_CATEGORY = "venture-pack";
