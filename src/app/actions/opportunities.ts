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
import { isIntelligenceEngineReady } from "@/lib/intelligence/env";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type OpportunitiesDataSource = "live" | "cache" | "unconfigured";

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

/** Live web intelligence feed — uses cache only when keys are missing or live fails. */
export async function fetchAllOpportunities(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas"
): Promise<FetchAllOpportunitiesResult> {
  const keysReady = isIntelligenceEngineReady();

  if (!keysReady) {
    const cached = await loadCachedOpportunities();
    if (cached.length) {
      return {
        opportunities: cached,
        source: "cache",
        statusMessage:
          "Showing cached signals. Add API keys to refresh with live web data.",
      };
    }
    return {
      opportunities: [],
      source: "unconfigured",
      statusMessage:
        "Add TAVILY_API_KEY (or SERPER_API_KEY) and OPENAI_API_KEY to .env.local, then restart the dev server.",
    };
  }

  const live = await refreshLiveOpportunityFeed(workspace, niche);

  if (live.ok && live.opportunities.length) {
    return { opportunities: live.opportunities, source: "live" };
  }

  const cached = await loadCachedOpportunities();
  if (cached.length) {
    return {
      opportunities: cached,
      source: "cache",
      statusMessage: live.error ?? "Showing cached signals while live refresh retries.",
    };
  }

  // Keys are configured — never label this as "unconfigured".
  return {
    opportunities: [],
    source: "live",
    statusMessage:
      live.error ??
      "Live engine is running — signals will appear momentarily. Try switching niche or refreshing.",
  };
}

export async function fetchDashboardFeed(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas"
): Promise<DashboardFeedPayload> {
  const { opportunities, source, statusMessage } = await fetchAllOpportunities(
    workspace,
    niche
  );
  const view = buildFeedViewModel(opportunities, workspace, niche);
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
