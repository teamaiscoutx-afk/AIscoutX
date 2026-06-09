import { getLlmProvider, isLlmConfigured } from "@/lib/intelligence/llm-router";
import {
  getWebSearchProvider,
  isWebSearchConfigured,
} from "@/lib/intelligence/web-search";
import type { IntelligenceConfig } from "@/lib/intelligence/types";

export function getIntelligenceConfig(): IntelligenceConfig {
  return {
    hasWebSearch: isWebSearchConfigured(),
    hasLlm: isLlmConfigured(),
    webProvider: getWebSearchProvider(),
    llmProvider: getLlmProvider(),
  };
}

export function isIntelligenceEngineReady(): boolean {
  const config = getIntelligenceConfig();
  return config.hasWebSearch && config.hasLlm;
}
