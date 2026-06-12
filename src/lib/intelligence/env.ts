import { readIntelligenceEnv } from "@/lib/env";

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
  const openai = Boolean(readIntelligenceEnv("OPENAI_API_KEY"));
  const anthropic = Boolean(readIntelligenceEnv("ANTHROPIC_API_KEY"));
  const tavily = Boolean(readIntelligenceEnv("TAVILY_API_KEY"));
  const serper = Boolean(readIntelligenceEnv("SERPER_API_KEY"));
  const perplexity = Boolean(readIntelligenceEnv("PERPLEXITY_API_KEY"));

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

/** Where to configure keys — Vercel production vs local dev. */
export function getIntelligenceSetupMessage(): string {
  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel) {
    return "Add OPENAI_API_KEY and TAVILY_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.";
  }
  return "Add TAVILY_API_KEY and OPENAI_API_KEY to .env.local, then restart npm run dev.";
}

export function getIntelligenceSetupMessageShort(): string {
  const onVercel = Boolean(process.env.VERCEL);
  return onVercel
    ? "Configure API keys in Vercel Environment Variables to enable live web intelligence."
    : "Add API keys to .env.local and restart the dev server for live web intelligence.";
}
