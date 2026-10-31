import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import { stableOpportunityId } from "@/lib/intelligence/stable-opportunity-id";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { LiveOpportunityDraft } from "@/lib/intelligence/types";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { OpportunityModeData } from "@/lib/database.types";
import { logServerError } from "@/lib/server/safe-action";
import { createCatalogWriterClient } from "@/lib/server/supabase-writer";

export function liveDraftToOpportunity(
  draft: LiveOpportunityDraft,
  workspace?: WorkspaceIdentity,
  niche?: NicheId,
  catalogSource: "live" | "optimized" = "live"
): Opportunity {
  const modeData: OpportunityModeData = {
    aiConfidence: draft.scores.aiConfidence,
    competitionLabel: draft.scores.competitionLabel,
    trendStage: draft.scores.trendStage,
    virality: draft.scores.scores.virality,
    monetization: draft.scores.scores.monetization,
    revenuePotential: draft.revenuePotential,
    sources: draft.sources,
    keywords: draft.keywords,
    hot: draft.scores.trendStage === "Breakout" || draft.scores.scores.demand >= 80,
    intelligence: draft.intelligence,
    deepDive: draft.deepDive,
    disruption: draft.scores.scores.disruption,
    liveSynthesizedAt: draft.deepDive.synthesizedAt,
    catalogSource,
  };

  const ws = workspace ?? "founder";
  const nc = niche ?? "b2b-saas";
  return {
    id: stableOpportunityId(draft.name, ws, nc, catalogSource),
    name: draft.name,
    category: draft.category,
    score: draft.scores.overallScore,
    aiConfidence: draft.scores.aiConfidence,
    growth: draft.scores.growthLabel,
    hot: modeData.hot,
    competitionLabel: draft.scores.competitionLabel,
    trendStage: draft.scores.trendStage,
    scores: {
      demand: draft.scores.scores.demand,
      competition: draft.scores.scores.competition,
      virality: draft.scores.scores.virality,
      monetization: draft.scores.scores.monetization,
      disruption: draft.scores.scores.disruption,
    },
    revenuePotential: draft.revenuePotential,
    sources: draft.sources,
    keywords: draft.keywords,
    intelligence: draft.intelligence,
    drawer: {
      whyThisMatters: draft.intelligence.founder.problem,
      recommendedAction: draft.intelligence.founder.solution,
      targetClients: draft.intelligence.agency.icp,
      viralVideoIdeas: draft.intelligence.creator.videoTitles,
    },
    deepDive: draft.deepDive,
    workspace,
    niche,
    catalogSource,
  };
}

/**
 * Persists live discovery rows into `opportunities.mode_data` using the
 * service-role client when available (required by catalog RLS in migration 005).
 */
export async function upsertLiveOpportunities(
  drafts: LiveOpportunityDraft[],
  workspace?: WorkspaceIdentity,
  niche?: NicheId,
  catalogSource: "live" | "optimized" = "live"
): Promise<Opportunity[]> {
  const supabase = createCatalogWriterClient();
  if (!supabase) {
    return drafts.map((d) => liveDraftToOpportunity(d, workspace, niche, catalogSource));
  }

  const opportunities = drafts.map((d) =>
    liveDraftToOpportunity(d, workspace, niche, catalogSource)
  );

  for (const opp of opportunities) {
    const row = {
      ...mapOpportunityToInsertRow(opp),
      id: opp.id,
    };

    const { error: upsertError } = await supabase
      .from("opportunities")
      .upsert(row, { onConflict: "id" });

    if (upsertError) {
      logServerError("opportunities.upsert", upsertError);
    }
  }

  return opportunities;
}
