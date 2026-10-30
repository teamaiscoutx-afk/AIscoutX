import {
  missingAzureOpenAIEnvKeys,
  readAzureOpenAIConfig,
  type AzureOpenAIConfig,
} from "@/lib/azure-ai";

export type AzureOpenAIResolveResult =
  | { ok: true; config: AzureOpenAIConfig }
  | { ok: false; error: string; missing: string[] };

/** Server routes: resolve Azure OpenAI at request time (never rely on build-time inlining). */
export function resolveServerAzureOpenAI(): AzureOpenAIResolveResult {
  const config = readAzureOpenAIConfig();
  if (config) {
    return { ok: true, config };
  }

  const missing = missingAzureOpenAIEnvKeys();
  return {
    ok: false,
    missing,
    error:
      missing.length > 0
        ? `Azure OpenAI is not configured. Set ${missing.join(", ")} in .env.local (server) and restart the dev server.`
        : "Azure OpenAI is not configured.",
  };
}
