"use server";

import { revalidatePath } from "next/cache";

import {
  loadCachedOpportunities,
  refreshLiveOpportunityFeed,
} from "@/app/actions/intelligence";
import { checkSavedIdea } from "@/app/actions/usage";
import { buildFeedViewModel } from "@/lib/dashboard/feed-utils";
import { mapOpportunityRowToClient } from "@/lib/dashboard/opportunity-mapper";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import { DISCOVERY_IDEA_TARGET } from "@/lib/intelligence/discovery-config";
import { generateStructuredFallbackDrafts } from "@/lib/intelligence/discovery-fallback";
import {
  getIntelligenceSetupMessage,
  isIntelligenceEngineReady,
} from "@/lib/intelligence/env";
import { liveDraftToOpportunity } from "@/lib/intelligence/opportunity-persistence";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type OpportunitiesDataSource = "live" | "cache" | "optimized" | "unconfigured";

export type FetchAllOpportunitiesResult = {
  opportunities: Opportunity[];
  source: OpportunitiesDataSource;
  statusMessage?: string;
};

export type DashboardFeedPayload = {
  opportunities: Opportunity[];
  opportunityOfTheDayId: string | null;
  trendingKeywords: string[];
  viralHooks: string[];
  source: OpportunitiesDataSource;
  statusMessage?: string;
};

/** Fast niche-scoped cache read for instant UI while live scan runs. */
export async function loadNicheDiscoverCache(
  workspace: WorkspaceIdentity,
  niche: NicheId
): Promise<Opportunity[]> {
  return loadCachedOpportunities(workspace, niche);
}

/** Client + server discover refresh — live scan with structured fallback padding. */
export async function refreshDiscoverFeed(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas",
  searchQuery?: string
): Promise<FetchAllOpportunitiesResult> {
  const extraSeeds = searchQuery?.trim()
    ? [searchQuery.trim(), `${searchQuery.trim()} startup opportunity`]
    : [];

  if (!isIntelligenceEngineReady()) {
    const cached = await loadCachedOpportunities(workspace, niche);
    if (cached.length) {
      return { opportunities: cached, source: "cache" };
    }

    const fallbackDrafts = generateStructuredFallbackDrafts(
      workspace,
      niche,
      DISCOVERY_IDEA_TARGET
    );
    const opportunities = fallbackDrafts.map((d) =>
      liveDraftToOpportunity(d, workspace, niche, "optimized")
    );
    if (opportunities.length) {
      return { opportunities, source: "optimized" };
    }

    return {
      opportunities: [],
      source: "unconfigured",
      statusMessage: getIntelligenceSetupMessage(),
    };
  }

  const live = await refreshLiveOpportunityFeed(workspace, niche, extraSeeds);

  if (live.opportunities.length > 0) {
    const source: OpportunitiesDataSource =
      live.source === "optimized"
        ? "optimized"
        : live.source === "mixed"
          ? "live"
          : "live";
    return { opportunities: live.opportunities, source };
  }

  const cached = await loadCachedOpportunities(workspace, niche);
  if (cached.length) {
    return { opportunities: cached, source: "cache" };
  }

  const fallbackDrafts = generateStructuredFallbackDrafts(
    workspace,
    niche,
    DISCOVERY_IDEA_TARGET
  );
  const opportunities = fallbackDrafts.map((d) =>
    liveDraftToOpportunity(d, workspace, niche, "optimized")
  );
  if (opportunities.length) {
    return { opportunities, source: "optimized" };
  }

  return {
    opportunities: [],
    source: "live",
    statusMessage:
      live.error ??
      "Live discovery failed for all niche seeds. Check Tavily and OpenAI keys, then restart the dev server.",
  };
}

/** Live Tavily + OpenAI feed only — no curated/seed fallbacks. */
export async function fetchAllOpportunities(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas"
): Promise<FetchAllOpportunitiesResult> {
  return refreshDiscoverFeed(workspace, niche);
}

export async function fetchDashboardFeed(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas"
): Promise<DashboardFeedPayload> {
  const { opportunities, source, statusMessage } = await fetchAllOpportunities(
    workspace,
    niche
  );
  const view = buildFeedViewModel(opportunities);
  return { ...view, source, statusMessage };
}

export async function fetchOpportunityById(
  id: string
): Promise<Opportunity | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapOpportunityRowToClient(data);
  } catch {
    return null;
  }
}

export async function saveOpportunity(
  opportunityId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const gate = await checkSavedIdea();
    if (!gate.allowed) {
      return { ok: false, error: gate.reason };
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Sign in to save signals." };
    }

    const { error } = await supabase.from("saved_opportunities").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save signal." };
  }
}
