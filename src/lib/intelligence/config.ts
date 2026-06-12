import {
  getIntelligenceEnvStatus,
  isIntelligenceEngineReady,
} from "@/lib/intelligence/env";
import type { IntelligenceConfig } from "@/lib/intelligence/types";

export { isIntelligenceEngineReady };

export function getIntelligenceConfig(): IntelligenceConfig {
  const env = getIntelligenceEnvStatus();
  return {
    hasWebSearch: env.hasWebSearch,
    hasLlm: env.hasLlm,
    webProvider: env.webProvider,
    llmProvider: env.llmProvider,
  };
}
