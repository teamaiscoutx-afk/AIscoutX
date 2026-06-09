import { isIntelligenceEngineReady } from "@/lib/intelligence/config";
import { mapLiveDraftToPacks } from "@/lib/intelligence/generation-bridge";
import { discoverLiveOpportunity } from "@/lib/intelligence/opportunity-engine";
import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";

/**
 * Live intelligence pipeline — web search + LLM synthesis.
 * Falls back to error when API keys are not configured (no mock output).
 */
export async function runGenerationPipeline(query: string): Promise<{
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
}> {
  if (!isIntelligenceEngineReady()) {
    throw new Error(
      "Generation requires live intelligence APIs. Configure web search + LLM keys in environment."
    );
  }

  const draft = await discoverLiveOpportunity(query);
  return mapLiveDraftToPacks(draft);
}

