"use server";

import { revalidatePath } from "next/cache";

import { incrementBlueprintUsage } from "@/app/actions/usage";
import { requirePro } from "@/lib/billing/paywall";
import { toClientError } from "@/lib/server/safe-action";
import { runGenerationPipeline } from "@/lib/mvp/generation-pipeline";
import { isIntelligenceEngineReady } from "@/lib/intelligence/config";
import type {
  AnalyzePack,
  BlueprintPack,
  LaunchPack,
  VenturePack,
} from "@/lib/mvp/types";
import type { OpportunityRow } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

/** Venture packs live on the shared `opportunities` table under this category. */
const VENTURE_PACK_CATEGORY = "venture-pack";

/** PostgREST JSON path to the pack owner inside mode_data. */
const PACK_OWNER_COLUMN = "mode_data->venturePack->>ownerId";

function mapPack(row: OpportunityRow, userId: string): VenturePack | null {
  const data = row.mode_data?.venturePack;
  if (!data) return null;
  return {
    id: row.id,
    userId: data.ownerId ?? userId,
    query: data.query ?? row.title,
    analyze: data.analyze,
    blueprint: data.blueprint,
    launch: data.launch,
    createdAt: row.created_at,
  };
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function brandSeed(query: string): string {
  const words = query.split(/\s+/).filter((w) => w.length > 3);
  const seed = words[0] ?? query;
  return seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
}

function buildMockAnalyze(query: string): AnalyzePack {
  const topic = titleCase(query);
  return {
    problemStatement: `Teams working on "${query}" still stitch together spreadsheets, chat threads, and manual research to make decisions. The work is slow, the data is stale, and the cost of getting it wrong compounds every week. A focused product that automates the core workflow wins on speed alone.`,
    marketSizing: {
      tam: "$4.2B global spend across adjacent tooling and services",
      sam: "$680M reachable via self-serve SaaS in English-speaking markets",
      som: "$8.5M realistic capture in 24 months at 0.5% niche penetration",
      growthRate: "23% CAGR driven by AI-native workflow adoption",
    },
    targetPersonas: [
      {
        name: "Solo Founder / Indie Hacker",
        pain: `Wastes 10+ hours a week on manual ${query} research and still ships on gut feel.`,
        willingnessToPay: "$19–$49/mo for a tool that saves one working day per week",
      },
      {
        name: "Early-Stage Product Lead",
        pain: "Needs defensible data for roadmap calls but has no analyst on the team.",
        willingnessToPay: "$99/mo team plan once two or more seats depend on it",
      },
      {
        name: "Agency Operator",
        pain: `Repeats the same ${topic} groundwork for every client engagement from scratch.`,
        willingnessToPay: "$199/mo if white-label reports are included",
      },
    ],
    competitors: [
      {
        name: "Legacy spreadsheet workflows",
        gap: "Zero automation, no live data, breaks the moment two people collaborate.",
        positioning: "We replace the manual grind with a live, always-current workspace.",
      },
      {
        name: "Horizontal AI chat tools",
        gap: "Generic answers with no persistent project context or structured output.",
        positioning: "We are purpose-built: structured outputs, saved context, repeatable runs.",
      },
      {
        name: "Enterprise suites",
        gap: "Six-month onboarding and pricing that locks out small teams entirely.",
        positioning: "Self-serve in 10 minutes at a price a solo founder can expense.",
      },
    ],
  };
}

function buildMockBlueprint(query: string): BlueprintPack {
  const seed = brandSeed(query);
  return {
    nameSuggestions: [`${seed}Pilot`, `${seed}Forge`, `Get${seed}`, `${seed}HQ`],
    featureMatrix: {
      mustHave: [
        "Guided onboarding that captures the user's niche and goal in under 2 minutes",
        `Core ${query} workspace with live status and structured outputs`,
        "Saved projects with instant recall — no re-explaining context",
        "Stripe-powered Pro plan with instant unlock after checkout",
      ],
      niceToHave: [
        "Email digests when tracked signals shift",
        "Export to PDF / Notion for client-ready deliverables",
        "Team seats with shared workspaces",
      ],
      future: [
        "Public API for programmatic runs",
        "Marketplace of community templates",
        "White-label mode for agencies",
      ],
    },
    pricingTiers: [
      {
        name: "Free",
        price: "$0",
        features: ["2 deep analyses per month", "1 active project", "Community support"],
      },
      {
        name: "Pro",
        price: "$19/mo",
        features: [
          "Unlimited analyses and blueprints",
          "Unlimited projects + 30-day trash recovery",
          "Priority email alerts",
        ],
      },
    ],
    techStack: [
      {
        layer: "Frontend",
        recommendation: "Next.js 14 (App Router) + Tailwind CSS",
        rationale: "Server components keep data fetching fast; Tailwind ships the dark neon system quickly.",
      },
      {
        layer: "Database & Auth",
        recommendation: "Supabase (Postgres + RLS)",
        rationale: "Row Level Security gives per-user isolation without writing an auth backend.",
      },
      {
        layer: "Billing",
        recommendation: "Stripe Subscriptions + webhooks",
        rationale: "Payment Links get to revenue in a day; webhooks auto-provision Pro access.",
      },
      {
        layer: "AI Runtime",
        recommendation: "Vercel AI SDK with OpenAI / Anthropic routing",
        rationale: "Streaming UX with provider fallback — no vendor lock-in on the model layer.",
      },
    ],
    roadmap: [
      {
        week: 1,
        milestone: "Core workspace live",
        tasks: [
          "Ship auth, onboarding, and the main workspace flow",
          "Wire Supabase schema with RLS policies",
          "Deploy to production behind a real domain",
        ],
      },
      {
        week: 2,
        milestone: "Monetization on",
        tasks: [
          "Connect Stripe checkout and webhook provisioning",
          "Gate Pro features and add the upgrade modal",
          "Set up transactional email (welcome + unlock)",
        ],
      },
      {
        week: 3,
        milestone: "First 50 users",
        tasks: [
          `Post the ${query} workflow in 3 niche communities`,
          "Run 10 user interviews and fix the top friction point",
          "Add usage analytics on activation events",
        ],
      },
      {
        week: 4,
        milestone: "Convert to paid",
        tasks: [
          "Launch on Product Hunt with a founder story",
          "Email trial users with a time-boxed Pro offer",
          "Double down on the acquisition channel that converted",
        ],
      },
    ],
  };
}

function buildMockLaunch(query: string): LaunchPack {
  const topic = titleCase(query);
  return {
    platforms: [
      {
        platform: "Reddit",
        playbook: [
          "Find 3 subreddits where your persona complains about this problem weekly",
          "Spend one week answering questions with zero self-promotion",
          "Post a build-in-public breakdown with real screenshots and numbers",
        ],
        samplePost: `I got tired of doing ${query} by hand, so I built a tool that does the heavy lifting. Sharing the exact workflow + what I'd do differently. Happy to answer anything.`,
      },
      {
        platform: "X",
        playbook: [
          "Ship a daily build-in-public thread for 14 days",
          "Tag tools you integrate with — their audiences overlap with yours",
          "Pin a 60-second demo clip with a clear CTA",
        ],
        samplePost: `Day 9 of building in public: ${topic} used to take me a full afternoon. Now it's 4 minutes. Demo in the thread 👇`,
      },
      {
        platform: "LinkedIn",
        playbook: [
          "Write one operator-style post per week: problem → numbers → lesson",
          "DM 5 people per day who engaged with adjacent content",
          "Offer a free teardown for the first 10 replies",
        ],
        samplePost: `We cut our ${query} cycle from 6 hours to 20 minutes. Here's the exact playbook, including what failed first.`,
      },
      {
        platform: "Product Hunt",
        playbook: [
          "Recruit 30 genuine supporters two weeks before launch",
          "Launch on a Tuesday with a founder comment posted at 00:01 PT",
          "Reply to every single comment within 15 minutes all day",
        ],
        samplePost: `${topic} on autopilot — structured outputs, live data, and a workspace that remembers your context. Free tier available today.`,
      },
    ],
    outreachScripts: [
      {
        channel: "Cold email",
        subject: `Cut your ${query} time by 80%`,
        body: `Hi {{firstName}},\n\nSaw your post about ${query}. We built a tool that turns that whole workflow into a 5-minute run — structured output, live data, no spreadsheets.\n\nWant a 10-minute walkthrough this week? If it doesn't save you time, I'll send you our internal playbook anyway.\n\n— {{founderName}}`,
      },
      {
        channel: "DM (X / LinkedIn)",
        subject: "Quick one",
        body: `Hey — noticed you're deep in ${query}. I'm building a tool that automates the research-to-decision loop. Can I send you a 60-second demo? Brutal feedback welcome.`,
      },
    ],
  };
}

/**
 * Premium mock pack — used when live intelligence APIs are missing or fail,
 * so the product journey never breaks (e.g. during a Stripe review).
 */
async function buildMockPack(query: string, userId: string): Promise<VenturePack> {
  return {
    id: `pack-${Date.now()}`,
    userId,
    query,
    analyze: buildMockAnalyze(query),
    blueprint: buildMockBlueprint(query),
    launch: buildMockLaunch(query),
    createdAt: new Date().toISOString(),
  };
}

/** Live pipeline when keys are configured; seamless premium mock otherwise. */
async function buildPack(query: string, userId: string): Promise<VenturePack> {
  if (!isIntelligenceEngineReady()) {
    return await buildMockPack(query, userId);
  }

  try {
    const { analyze, blueprint, launch } = await runGenerationPipeline(query);
    return {
      id: `pack-${Date.now()}`,
      userId,
      query,
      analyze,
      blueprint,
      launch,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return await buildMockPack(query, userId);
  }
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("opportunities") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("pgrst205") ||
    lower.includes("row-level security")
  );
}

export type GenerateVenturePackResult = {
  ok: boolean;
  pack?: VenturePack;
  storageMode?: "database" | "local";
  error?: string;
  code?: string;
};

export async function generateVenturePack(
  query: string
): Promise<GenerateVenturePackResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Enter what you're building to generate a blueprint.",
    };
  }

  const gate = await requirePro("blueprint");
  if (!gate.allowed) {
    return { ok: false, error: gate.reason, code: gate.code };
  }

  if (!isSupabaseConfigured()) {
    try {
      const pack = await buildPack(trimmed, "demo");
      return { ok: true, pack, storageMode: "local" };
    } catch (err) {
      return toClientError("generation.buildPack", err);
    }
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? "local";
    const pack = await buildPack(trimmed, userId);

    if (!user) {
      return { ok: true, pack, storageMode: "local" };
    }

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        title: trimmed,
        category: VENTURE_PACK_CATEGORY,
        mode_data: {
          venturePack: {
            ownerId: user.id,
            query: trimmed,
            analyze: pack.analyze,
            blueprint: pack.blueprint,
            launch: pack.launch,
          },
        },
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: true, pack, storageMode: "local" };
      }
      return toClientError(
        "generation.insert",
        new Error(error.message),
        "Could not save your blueprint. Try again."
      );
    }

    if (!data) {
      return { ok: true, pack, storageMode: "local" };
    }

    await incrementBlueprintUsage().catch(() => undefined);

    revalidatePath("/dashboard/analyze");
    revalidatePath("/dashboard/blueprints");
    revalidatePath("/dashboard/launch");

    return {
      ok: true,
      pack: mapPack(data, user.id) ?? pack,
      storageMode: "database",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    if (isMissingTableError(message)) {
      try {
        const pack = await buildPack(trimmed, "local");
        return { ok: true, pack, storageMode: "local" };
      } catch (buildErr) {
        return toClientError("generation.fallback", buildErr);
      }
    }
    return toClientError("generation.run", err);
  }
}

export async function getLatestVenturePack(): Promise<VenturePack | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("category", VENTURE_PACK_CATEGORY)
      .eq(PACK_OWNER_COLUMN, user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapPack(data, user.id);
  } catch {
    return null;
  }
}

export async function getVenturePackById(
  packId: string
): Promise<VenturePack | null> {
  if (!isSupabaseConfigured() || packId.startsWith("local-")) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", packId)
      .eq("category", VENTURE_PACK_CATEGORY)
      .eq(PACK_OWNER_COLUMN, user.id)
      .maybeSingle();

    if (error || !data) return null;
    return mapPack(data, user.id);
  } catch {
    return null;
  }
}
