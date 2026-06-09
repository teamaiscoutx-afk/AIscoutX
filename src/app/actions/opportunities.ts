"use server";

import { revalidatePath } from "next/cache";

import { checkSavedIdea } from "@/app/actions/usage";
import { buildFeedViewModel } from "@/lib/dashboard/feed-utils";
import { mapOpportunityRowToClient } from "@/lib/dashboard/opportunity-mapper";
import { getSeedOpportunities } from "@/lib/seed/opportunity-seeds";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import { mockOpportunities } from "@/lib/dashboard/opportunities";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type OpportunitiesDataSource = "supabase" | "mock";

export type FetchAllOpportunitiesResult = {
  opportunities: Opportunity[];
  source: OpportunitiesDataSource;
};

export type DashboardFeedPayload = {
  opportunities: Opportunity[];
  opportunityOfTheDayId: string | null;
  trendingKeywords: string[];
  viralHooks: string[];
  source: OpportunitiesDataSource;
};

/** Fetch every row from `opportunities` (newest / highest score first). */
export async function fetchAllOpportunities(): Promise<FetchAllOpportunitiesResult> {
  if (!isSupabaseConfigured()) {
    return { opportunities: mockOpportunities, source: "mock" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("score", { ascending: false });

    if (error) {
      console.error("[fetchAllOpportunities]", error.message);
      return { opportunities: getSeedOpportunities(), source: "mock" };
    }

    if (!data?.length) {
      return { opportunities: getSeedOpportunities(), source: "mock" };
    }

    return {
      opportunities: data.map(mapOpportunityRowToClient),
      source: "supabase",
    };
  } catch (err) {
    console.error("[fetchAllOpportunities]", err);
    return { opportunities: getSeedOpportunities(), source: "mock" };
  }
}

/** Load all rows, then slice for workspace + niche (used by legacy callers). */
export async function fetchDashboardFeed(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas"
): Promise<DashboardFeedPayload> {
  const { opportunities, source } = await fetchAllOpportunities();
  const view = buildFeedViewModel(opportunities, workspace, niche);
  return { ...view, source };
}

export async function fetchOpportunityById(
  id: string
): Promise<Opportunity | null> {
  if (!isSupabaseConfigured()) {
    return mockOpportunities.find((o) => o.id === id) ?? null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return mockOpportunities.find((o) => o.id === id) ?? null;
    }

    return mapOpportunityRowToClient(data);
  } catch {
    return mockOpportunities.find((o) => o.id === id) ?? null;
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
