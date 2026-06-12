import { readServerEnv } from "@/lib/env";

export type IntelligenceEnvStatus = {
  openai: boolean;
  anthropic: boolean;
  tavily: boolean;
  serper: boolean;
  perplexity: boolean;
  hasLlm: boolean;
  hasWebSearch: boolean;
  ready: boolean;
  llmProvider: "openai" | "anthropic" | null;
  webProvider: "tavily" | "serper" | "perplexity" | null;
};

/** Single source of truth for intelligence API key detection (server-only). */
export function getIntelligenceEnvStatus(): IntelligenceEnvStatus {
  const openai = Boolean(readServerEnv("OPENAI_API_KEY"));
  const anthropic = Boolean(readServerEnv("ANTHROPIC_API_KEY"));
  const tavily = Boolean(readServerEnv("TAVILY_API_KEY"));
  const serper = Boolean(readServerEnv("SERPER_API_KEY"));
  const perplexity = Boolean(readServerEnv("PERPLEXITY_API_KEY"));

  const hasLlm = openai || anthropic;
  const hasWebSearch = tavily || serper || perplexity;

  return {
    openai,
    anthropic,
    tavily,
    serper,
    perplexity,
    hasLlm,
    hasWebSearch,
    ready: hasLlm && hasWebSearch,
    llmProvider: openai ? "openai" : anthropic ? "anthropic" : null,
    webProvider: tavily ? "tavily" : serper ? "serper" : perplexity ? "perplexity" : null,
  };
}

export function isIntelligenceEngineReady(): boolean {
  return getIntelligenceEnvStatus().ready;
}
