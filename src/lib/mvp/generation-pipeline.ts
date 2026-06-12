import { isIntelligenceEngineReady } from "@/lib/intelligence/env";
import { mapLiveDraftToPacks } from "@/lib/intelligence/generation-bridge";
import { discoverLiveOpportunity } from "@/lib/intelligence/opportunity-engine";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getNicheLabel } from "@/lib/dashboard/onboarding";
import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";

export type GenerationContext = {
  workspace?: WorkspaceIdentity;
  niche?: NicheId;
  nicheLabel?: string;
};

/**
 * Live intelligence pipeline — Tavily web search + OpenAI/Anthropic synthesis.
 * Requires both web search and LLM keys in .env.local.
 */
export async function runGenerationPipeline(
  query: string,
  context?: GenerationContext
): Promise<{
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
}> {
  if (!isIntelligenceEngineReady()) {
    throw new Error(
      "Generation requires TAVILY_API_KEY (or SERPER_API_KEY) and OPENAI_API_KEY in .env.local."
    );
  }

  const workspace = context?.workspace ?? "founder";
  const niche = context?.niche ?? "b2b-saas";
  const nicheLabel =
    context?.nicheLabel ?? getNicheLabel(workspace, niche);

  const researchQuery = `${query.trim()} — ${nicheLabel} niche startup opportunity`;

  const draft = await discoverLiveOpportunity(researchQuery, {
    workspace,
    niche,
    nicheLabel,
    seedTokens: [researchQuery],
  });

  return mapLiveDraftToPacks(draft);
}
