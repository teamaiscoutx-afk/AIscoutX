export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AzureOpenAIConfig = {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
};

const DEFAULT_API_VERSION = "2024-02-15-preview";

export function readAzureOpenAIConfig(): AzureOpenAIConfig | null {
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim()?.replace(/\/$/, "");
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME?.trim();
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!apiKey || !endpoint || !deployment) return null;

  return { apiKey, endpoint, deployment, apiVersion };
}

export function isAzureOpenAIConfigured(): boolean {
  return readAzureOpenAIConfig() !== null;
}

export async function azureChatCompletion(input: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const config = readAzureOpenAIConfig();
  if (!config) {
    throw new Error(
      "Azure OpenAI is not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME."
    );
  }

  const url = `${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 1200,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Azure OpenAI error ${response.status}: ${raw.slice(0, 400)}`);
  }

  let parsed: { choices?: { message?: { content?: string } }[] };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error("Azure OpenAI returned invalid JSON.");
  }

  const content = parsed.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Azure OpenAI returned an empty completion.");
  }

  return content;
}
