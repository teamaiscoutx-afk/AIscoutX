import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { LiveOpportunityDraft } from "@/lib/intelligence/types";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { OpportunityModeData } from "@/lib/database.types";
import { logServerError } from "@/lib/server/safe-action";
import { createCatalogWriterClient } from "@/lib/server/supabase-writer";

export function liveDraftToOpportunity(
  draft: LiveOpportunityDraft,
  workspace?: WorkspaceIdentity,
  niche?: NicheId
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
    catalogSource: "live",
  };

  return {
    id: `live-${draft.name.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`,
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
    catalogSource: "live",
  };
}

/**
 * Persists live discovery rows into `opportunities.mode_data` using the
 * service-role client when available (required by catalog RLS in migration 005).
 */
export async function upsertLiveOpportunities(
  drafts: LiveOpportunityDraft[],
  workspace?: WorkspaceIdentity,
  niche?: NicheId
): Promise<Opportunity[]> {
  const supabase = createCatalogWriterClient();
  if (!supabase) {
    return drafts.map((d) => liveDraftToOpportunity(d, workspace, niche));
  }

  const opportunities = drafts.map((d) =>
    liveDraftToOpportunity(d, workspace, niche)
  );

  for (const opp of opportunities) {
    const row = mapOpportunityToInsertRow(opp);
    const { data: existing, error: lookupError } = await supabase
      .from("opportunities")
      .select("id")
      .eq("title", opp.name)
      .eq("category", opp.category)
      .maybeSingle();

    if (lookupError) {
      logServerError("opportunities.upsert.lookup", lookupError);
      continue;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          score: row.score,
          growth: row.growth,
          demand: row.demand,
          competition: row.competition,
          mode_data: row.mode_data,
          workspace_mode: row.workspace_mode,
          current_niche: row.current_niche,
        })
        .eq("id", existing.id);

      if (updateError) {
        logServerError("opportunities.upsert.update", updateError);
        continue;
      }
      opp.id = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("opportunities")
        .insert(row)
        .select("id")
        .single();

      if (insertError) {
        logServerError("opportunities.upsert.insert", insertError);
        continue;
      }
      if (inserted?.id) opp.id = inserted.id;
    }
  }

  return opportunities;
}
