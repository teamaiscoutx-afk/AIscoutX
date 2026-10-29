import { readIntelligenceEnv } from "@/lib/env";

export type IntelligenceEnvStatus = {
  azureOpenAI: boolean;
  openai: boolean;
  anthropic: boolean;
  tavily: boolean;
  serper: boolean;
  perplexity: boolean;
  azureSearch: boolean;
  azureBing: boolean;
  hasLlm: boolean;
  hasWebSearch: boolean;
  ready: boolean;
  llmProvider: "azure" | "openai" | "anthropic" | null;
  webProvider: "azure_search" | "bing" | "tavily" | "serper" | "perplexity" | null;
};

/** Single source of truth for intelligence API key detection (server-only). */
export function getIntelligenceEnvStatus(): IntelligenceEnvStatus {
  const azureOpenAI = Boolean(
    readIntelligenceEnv("AZURE_OPENAI_API_KEY") &&
      readIntelligenceEnv("AZURE_OPENAI_ENDPOINT") &&
      readIntelligenceEnv("AZURE_OPENAI_DEPLOYMENT_NAME")
  );
  const openai = Boolean(readIntelligenceEnv("OPENAI_API_KEY"));
  const anthropic = Boolean(readIntelligenceEnv("ANTHROPIC_API_KEY"));
  const tavily = Boolean(readIntelligenceEnv("TAVILY_API_KEY"));
  const serper = Boolean(readIntelligenceEnv("SERPER_API_KEY"));
  const perplexity = Boolean(readIntelligenceEnv("PERPLEXITY_API_KEY"));
  const azureSearch = Boolean(
    readIntelligenceEnv("AZURE_SEARCH_ENDPOINT") &&
      readIntelligenceEnv("AZURE_SEARCH_API_KEY") &&
      readIntelligenceEnv("AZURE_SEARCH_INDEX_NAME")
  );
  const azureBing = Boolean(
    readIntelligenceEnv("AZURE_BING_SEARCH_KEY") ||
      readIntelligenceEnv("BING_SEARCH_V7_SUBSCRIPTION_KEY")
  );

  const hasLlm = azureOpenAI || openai || anthropic;
  const hasWebSearch = azureSearch || azureBing || tavily || serper || perplexity;

  return {
    azureOpenAI,
    openai,
    anthropic,
    tavily,
    serper,
    perplexity,
    azureSearch,
    azureBing,
    hasLlm,
    hasWebSearch,
    ready: hasLlm && hasWebSearch,
    llmProvider: azureOpenAI ? "azure" : openai ? "openai" : anthropic ? "anthropic" : null,
    webProvider: azureSearch
      ? "azure_search"
      : azureBing
        ? "bing"
        : tavily
          ? "tavily"
          : serper
            ? "serper"
            : perplexity
              ? "perplexity"
              : null,
  };
}

export function isIntelligenceEngineReady(): boolean {
  const status = getIntelligenceEnvStatus();
  if (status.azureOpenAI) return true;
  return status.ready;
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
