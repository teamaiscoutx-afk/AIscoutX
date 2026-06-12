"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/app/actions/profile";
import { mapOpportunityRowToClient } from "@/lib/dashboard/opportunity-mapper";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getIntelligenceEnvStatus, isIntelligenceEngineReady, getIntelligenceSetupMessage } from "@/lib/intelligence/env";
import { resolveDiscoverySeeds } from "@/lib/intelligence/niche-seeds";
import {
  discoverOpportunityBatch,
  refreshOpportunityDeepDive,
} from "@/lib/intelligence/opportunity-engine";
import {
  liveDraftToOpportunity,
  upsertLiveOpportunities,
} from "@/lib/intelligence/opportunity-persistence";
import type { OpportunityDeepDive } from "@/lib/intelligence/types";
import { createCatalogWriterClient } from "@/lib/server/supabase-writer";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type IntelligenceStatus = {
  ready: boolean;
  webProvider: string | null;
  llmProvider: string | null;
  message: string;
};

export async function getIntelligenceStatus(): Promise<IntelligenceStatus> {
  const env = getIntelligenceEnvStatus();
  if (env.ready) {
    return {
      ready: true,
      webProvider: env.webProvider,
      llmProvider: env.llmProvider,
      message: `Live engine active via ${env.webProvider} + ${env.llmProvider}.`,
    };
  }

  return {
    ready: false,
    webProvider: env.webProvider,
    llmProvider: env.llmProvider,
    message: getIntelligenceSetupMessage(),
  };
}

export async function refreshLiveOpportunityFeed(
  workspace: WorkspaceIdentity = "founder",
  niche: NicheId = "b2b-saas",
  extraSeeds: string[] = []
): Promise<{ ok: boolean; opportunities: Opportunity[]; error?: string }> {
  try {
    const seeds = resolveDiscoverySeeds(workspace, niche, extraSeeds);
    const drafts = await discoverOpportunityBatch(seeds, {
      workspace,
      niche,
      seedTokens: seeds,
    });

    if (!drafts.length) {
      return { ok: false, opportunities: [], error: "No live signals returned." };
    }

    let opportunities = drafts.map((d) => liveDraftToOpportunity(d, workspace, niche));

    if (isSupabaseConfigured()) {
      opportunities = await upsertLiveOpportunities(drafts, workspace, niche);
    }

    try {
      revalidatePath("/dashboard/discover");
    } catch {
      // revalidatePath requires a Next.js request context — safe to skip in scripts/tests.
    }
    return { ok: true, opportunities };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Live refresh failed";
    return { ok: false, opportunities: [], error: message };
  }
}

export async function fetchOpportunityDeepDive(
  opportunityId: string,
  seed: string
): Promise<{
  ok: boolean;
  deepDive?: OpportunityDeepDive;
  error?: string;
  code?: string;
}> {
  if (!isIntelligenceEngineReady()) {
    return { ok: false, error: "Intelligence engine not configured." };
  }

  try {
    let existing: OpportunityDeepDive | undefined;

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("opportunities")
        .select("mode_data")
        .eq("id", opportunityId)
        .maybeSingle();

      const modeData = data?.mode_data as { deepDive?: OpportunityDeepDive } | null;
      existing = modeData?.deepDive;
    }

    const deepDive = await refreshOpportunityDeepDive(seed, existing);

    if (isSupabaseConfigured()) {
      const supabase = createCatalogWriterClient();
      if (supabase) {
        const { data: row } = await supabase
          .from("opportunities")
          .select("mode_data")
          .eq("id", opportunityId)
          .maybeSingle();

        const modeData = (row?.mode_data ?? {}) as Record<string, unknown>;
        await supabase
          .from("opportunities")
          .update({ mode_data: { ...modeData, deepDive } })
          .eq("id", opportunityId);
      }
    }

    return { ok: true, deepDive };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deep-dive fetch failed";
    return { ok: false, error: message };
  }
}

export async function discoverFromQuery(
  query: string
): Promise<{ ok: boolean; opportunity?: Opportunity; error?: string }> {
  if (!isIntelligenceEngineReady()) {
    return { ok: false, error: "Intelligence engine not configured." };
  }

  try {
    const profile = await getCurrentProfile();
    const workspace = profile?.workspace_mode ?? "founder";
    const niche = (profile?.current_niche as NicheId) ?? "b2b-saas";

    const { discoverLiveOpportunity } = await import(
      "@/lib/intelligence/opportunity-engine"
    );
    const draft = await discoverLiveOpportunity(query, { workspace, niche });
    let opportunity = liveDraftToOpportunity(draft, workspace, niche);

    if (isSupabaseConfigured()) {
      const [saved] = await upsertLiveOpportunities([draft], workspace, niche);
      opportunity = saved;
    }

    revalidatePath("/dashboard/discover");
    return { ok: true, opportunity };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Discovery failed";
    return { ok: false, error: message };
  }
}

export async function loadCachedOpportunities(): Promise<Opportunity[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .neq("category", "venture-pack")
    .eq("is_deleted", false)
    .eq("mode_data->>catalogSource", "live")
    .order("score", { ascending: false })
    .limit(20);

  return (data ?? []).map(mapOpportunityRowToClient);
}
