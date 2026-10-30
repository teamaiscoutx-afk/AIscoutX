import { isAzureOpenAIConfigured, isAzureSearchConfigured } from "@/lib/azure-ai";
import { readIntelligenceEnv } from "@/lib/env";

export type IntelligenceEnvStatus = {
  azureOpenAI: boolean;
  openai: boolean;
  anthropic: boolean;
  azureSearch: boolean;
  hasLlm: boolean;
  hasWebSearch: boolean;
  ready: boolean;
  llmProvider: "azure" | "openai" | "anthropic" | null;
  webProvider: "azure_search" | null;
};

/** Single source of truth for intelligence API key detection (server-only). */
export function getIntelligenceEnvStatus(): IntelligenceEnvStatus {
  const azureOpenAI = isAzureOpenAIConfigured();
  const openai = Boolean(readIntelligenceEnv("OPENAI_API_KEY"));
  const anthropic = Boolean(readIntelligenceEnv("ANTHROPIC_API_KEY"));
  const azureSearch = isAzureSearchConfigured();

  const hasLlm = azureOpenAI || openai || anthropic;
  const hasWebSearch = azureSearch;

  return {
    azureOpenAI,
    openai,
    anthropic,
    azureSearch,
    hasLlm,
    hasWebSearch,
    ready: azureOpenAI,
    llmProvider: azureOpenAI ? "azure" : openai ? "openai" : anthropic ? "anthropic" : null,
    webProvider: azureSearch ? "azure_search" : null,
  };
}

export function isIntelligenceEngineReady(): boolean {
  return isAzureOpenAIConfigured();
}

/** Where to configure keys — Vercel production vs local dev. */
export function getIntelligenceSetupMessage(): string {
  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel) {
    return "Add AZURE_OPENAI_* and AZURE_SEARCH_* in Vercel → Environment Variables, then redeploy.";
  }
  return "Add AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, and Azure AI Search keys to .env.local, then restart npm run dev.";
}

export function getIntelligenceSetupMessageShort(): string {
  const onVercel = Boolean(process.env.VERCEL);
  return onVercel
    ? "Configure Azure OpenAI + Azure AI Search in Vercel Environment Variables."
    : "Add Azure OpenAI + Azure AI Search keys to .env.local and restart the dev server.";
}
