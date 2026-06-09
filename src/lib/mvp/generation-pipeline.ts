import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Sequenced generation pipeline — structured output ready for LLM swap-in.
 * Replace internals with OpenAI/Anthropic calls without changing consumers.
 */
export function runGenerationPipeline(query: string): {
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
} {
  const idea = query.trim() || "AI SaaS for creators";
  const branded = titleCase(idea);

  const analyze: AnalyzePack = {
    problemStatement: `Founders building ${idea} struggle with fragmented workflows, slow validation cycles, and unclear positioning against incumbents.`,
    marketSizing: {
      tam: "$4.2B — global addressable workflow + creator tooling market",
      sam: "$680M — early-stage builders in English-speaking markets",
      som: "$12M — reachable wedge in first 18 months with focused GTM",
      growthRate: "+28% YoY demand signal in adjacent categories",
    },
    targetPersonas: [
      {
        name: "Solo Founder / Indie Hacker",
        pain: "Needs a 10-minute blueprint from idea to execution without hiring a team",
        willingnessToPay: "$19–49/mo for actionable plans",
      },
      {
        name: "Creator Operator",
        pain: "Wants monetizable productized services around their audience",
        willingnessToPay: "$29–99/mo for launch scripts + positioning",
      },
      {
        name: "Agency Builder",
        pain: "Runs parallel ventures and needs repeatable validation playbooks",
        willingnessToPay: "$99+/mo for unlimited packs",
      },
    ],
    competitors: [
      {
        name: "Generic AI chat tools",
        gap: "No structured founder OS pipeline or GPS scoring",
        positioning: "Position as execution system, not chat wrapper",
      },
      {
        name: "No-code app builders",
        gap: "Skip validation and GTM strategy",
        positioning: "Lead with Analyze → Blueprint → Launch sequence",
      },
      {
        name: "Market research dashboards",
        gap: "Insights without step-by-step execution",
        positioning: "Deliver markdown-ready action packs in 10 minutes",
      },
    ],
  };

  const blueprint: BlueprintPack = {
    nameSuggestions: [
      `${branded.split(" ")[0]}OS`,
      `Launch${branded.replace(/\s/g, "")}`,
      `${branded} Blueprint`,
    ],
    featureMatrix: {
      mustHave: [
        "Idea-to-blueprint generator (10-minute promise)",
        "Analyze module with problem + competitor gaps",
        "Exportable markdown execution plans",
      ],
      niceToHave: [
        "Founder GPS progress scoring",
        "Saved venture pack library",
        "Launch channel script templates",
      ],
      future: [
        "Stripe-powered tier automation",
        "Custom niche signal feeds",
        "Weekly opportunity digest emails",
      ],
    },
    pricingTiers: [
      {
        name: "Free",
        price: "$0",
        features: ["5 opportunity views/day", "2 blueprints/month", "Basic analysis preview"],
      },
      {
        name: "Starter",
        price: "$19–29/mo",
        features: ["Unlimited blueprints", "Deep competitor gaps", "Full launch scripts"],
      },
      {
        name: "Pro",
        price: "$49/mo",
        features: ["Unlimited everything", "Advanced GPS", "Priority generation"],
      },
    ],
    techStack: [
      { layer: "Frontend", recommendation: "Next.js 14 + Tailwind", rationale: "Fast SSR, premium UI" },
      { layer: "Auth + DB", recommendation: "Supabase", rationale: "RLS + usage wallet enforcement" },
      { layer: "Payments", recommendation: "Stripe webhooks", rationale: "Plan tier activation" },
      { layer: "AI", recommendation: "Structured LLM pipeline", rationale: "Analyze → Blueprint → Launch packs" },
    ],
    roadmap: [
      {
        week: 1,
        milestone: "Validation sprint",
        tasks: ["10 ICP interviews", "Landing page with waitlist", "Problem statement A/B test"],
      },
      {
        week: 2,
        milestone: "MVP scope lock",
        tasks: ["Must-have feature cut", "Wireframe core flows", "Set up auth + billing skeleton"],
      },
      {
        week: 3,
        milestone: "Build core generator",
        tasks: ["Pipeline orchestration", "Usage wallet checks", "Export markdown blueprints"],
      },
      {
        week: 4,
        milestone: "Launch v1",
        tasks: ["Product Hunt draft", "Reddit + LinkedIn posts", "Onboard 20 beta founders"],
      },
    ],
  };

  const launch: LaunchPack = {
    platforms: [
      {
        platform: "Reddit",
        playbook: [
          "Post value-first story in r/SaaS and r/Entrepreneur",
          "Share before/after: idea → blueprint in 10 minutes",
          "Reply to every comment within 2 hours on launch day",
        ],
        samplePost: `I built a system that turns "${idea}" into a full startup blueprint in ~10 minutes. Happy to share the framework if useful — what would you validate first?`,
      },
      {
        platform: "LinkedIn",
        playbook: [
          "Publish carousel: Problem → Analyze → Blueprint → Launch",
          "Tag 3 founder friends for distribution",
          "DM warm connections with personalized outreach script",
        ],
        samplePost: `From startup idea to startup blueprint in 10 minutes. Here's how we're helping founders ship ${idea} without analysis paralysis. 🚀`,
      },
      {
        platform: "X",
        playbook: [
          "Thread: 5 tweets on the wedge + competitor gap",
          "Pin launch tweet with demo GIF",
          "Engage 20 relevant accounts pre-launch",
        ],
        samplePost: `Stop brainstorming. Start executing.\n\n"${idea}" → full blueprint in 10 min.\n\nAnalyze. Blueprint. Launch. Repeat.`,
      },
      {
        platform: "Product Hunt",
        playbook: [
          "Schedule Tuesday 12:01 AM PT launch",
          "Prepare maker comment + first 3 FAQs",
          "Mobilize email list + LinkedIn for upvotes",
        ],
        samplePost: `AIscoutX — From Startup Idea to Startup Blueprint in 10 Minutes. Built for founders who want execution, not another chatbot.`,
      },
    ],
    outreachScripts: [
      {
        channel: "Cold email",
        subject: `Quick idea on ${branded}`,
        body: `Hi {{name}},\n\nI noticed you work on {{niche}}. I'm validating ${idea} and would love 15 minutes to learn how you currently go from idea to launch.\n\nOpen to a quick call this week?\n\n— {{your_name}}`,
      },
      {
        channel: "LinkedIn DM",
        subject: "Founder-to-founder",
        body: `Hey {{name}} — building ${idea}. If you have 2 min, what's the #1 thing you'd want in a 10-minute startup blueprint tool?`,
      },
    ],
  };

  return { analyze, blueprint, launch };
}
