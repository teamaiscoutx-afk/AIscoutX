import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";
import { readIntelligenceEnv, readServerEnv } from "@/lib/env";
import { withTimeout } from "@/lib/server/with-timeout";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AzureMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

/** Messages for Azure chat/completions (text or multimodal user turns). */
export type AzureCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string | AzureMessageContentPart[];
};

export type AzureOpenAIConfig = {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
};

export type MarketSnippet = {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  publishedAt?: string;
};

export type LiveMarketContext = {
  query: string;
  scannedAt: string;
  provider: "azure_search" | "azure_openai" | "synthetic" | "skipped";
  snippets: MarketSnippet[];
};

const DEFAULT_API_VERSION = "2024-02-15-preview";

/** Default index when AZURE_SEARCH_INDEX_NAME is unset (override in .env.local). */
const DEFAULT_AZURE_SEARCH_INDEX = "aiscoutx-market";

export function readAzureOpenAIConfig(): AzureOpenAIConfig | null {
  const apiKey =
    readIntelligenceEnv("AZURE_OPENAI_API_KEY") ?? readServerEnv("AZURE_OPENAI_KEY");
  const endpoint = (
    readIntelligenceEnv("AZURE_OPENAI_ENDPOINT") ?? readServerEnv("AZURE_OPENAI_API_BASE")
  )?.replace(/\/$/, "");
  const deployment =
    readIntelligenceEnv("AZURE_OPENAI_DEPLOYMENT_NAME") ??
    readServerEnv("AZURE_OPENAI_DEPLOYMENT") ??
    readServerEnv("AZURE_OPENAI_MODEL");
  const apiVersion =
    readIntelligenceEnv("AZURE_OPENAI_API_VERSION") || DEFAULT_API_VERSION;

  if (!apiKey || !endpoint || !deployment) return null;

  return { apiKey, endpoint, deployment, apiVersion };
}

/** Names of unset Azure OpenAI env vars (for API error messages). */
export function missingAzureOpenAIEnvKeys(): string[] {
  const missing: string[] = [];
  if (!(readIntelligenceEnv("AZURE_OPENAI_API_KEY") ?? readServerEnv("AZURE_OPENAI_KEY"))) {
    missing.push("AZURE_OPENAI_API_KEY");
  }
  if (!(readIntelligenceEnv("AZURE_OPENAI_ENDPOINT") ?? readServerEnv("AZURE_OPENAI_API_BASE"))) {
    missing.push("AZURE_OPENAI_ENDPOINT");
  }
  if (
    !(
      readIntelligenceEnv("AZURE_OPENAI_DEPLOYMENT_NAME") ??
      readServerEnv("AZURE_OPENAI_DEPLOYMENT") ??
      readServerEnv("AZURE_OPENAI_MODEL")
    )
  ) {
    missing.push("AZURE_OPENAI_DEPLOYMENT_NAME");
  }
  return missing;
}

export function readAzureSearchIndexName(): string | undefined {
  return (
    readIntelligenceEnv("AZURE_SEARCH_INDEX_NAME") ??
    readServerEnv("AZURE_SEARCH_INDEX") ??
    DEFAULT_AZURE_SEARCH_INDEX
  );
}

export function isAzureOpenAIConfigured(): boolean {
  return readAzureOpenAIConfig() !== null;
}

export function isAzureSearchConfigured(): boolean {
  return Boolean(
    readIntelligenceEnv("AZURE_SEARCH_ENDPOINT") &&
      readIntelligenceEnv("AZURE_SEARCH_API_KEY") &&
      readAzureSearchIndexName()
  );
}

/** Azure OpenAI chat completions (deployment-scoped). */
export async function azureChatCompletion(input: {
  messages: ChatMessage[] | AzureCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const config = readAzureOpenAIConfig();
  if (!config) {
    throw new Error(
      "Azure OpenAI is not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME."
    );
  }

  const url = `${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`;

  const body: Record<string, unknown> = {
    messages: input.messages,
    temperature: input.temperature ?? 0.65,
    max_tokens: input.maxTokens ?? 1800,
  };

  if (input.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify(body),
    signal: input.signal,
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

/** Stream token deltas from Azure OpenAI chat completions (`stream: true`). */
export async function azureChatCompletionStream(input: {
  messages: ChatMessage[] | AzureCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<Response> {
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
      temperature: input.temperature ?? 0.65,
      max_tokens: input.maxTokens ?? 1200,
      stream: true,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Azure OpenAI stream error ${response.status}: ${raw.slice(0, 400)}`);
  }

  if (!response.body) {
    throw new Error("Azure OpenAI returned an empty stream body.");
  }

  return response;
}

function mapAzureSearchDocuments(
  docs: Record<string, unknown>[],
  maxResults: number
): MarketSnippet[] {
  return docs.slice(0, maxResults).map((doc, i) => {
    const title =
      (typeof doc.title === "string" && doc.title) ||
      (typeof doc.name === "string" && doc.name) ||
      `Result ${i + 1}`;
    const url =
      (typeof doc.url === "string" && doc.url) ||
      (typeof doc.link === "string" && doc.link) ||
      "";
    const excerpt =
      (typeof doc.content === "string" && doc.content) ||
      (typeof doc.description === "string" && doc.description) ||
      (typeof doc.chunk === "string" && doc.chunk) ||
      JSON.stringify(doc).slice(0, 500);

    return {
      title,
      url,
      excerpt: excerpt.slice(0, 600),
      source: "Azure AI Search",
    };
  });
}

async function postAzureSearch(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  maxResults: number
): Promise<MarketSnippet[]> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    value?: Record<string, unknown>[];
  };

  return mapAzureSearchDocuments(data.value ?? [], maxResults);
}

async function searchAzureAiSearch(query: string, maxResults = 8): Promise<MarketSnippet[]> {
  const endpoint = readIntelligenceEnv("AZURE_SEARCH_ENDPOINT")?.replace(/\/$/, "");
  const apiKey = readIntelligenceEnv("AZURE_SEARCH_API_KEY");
  const indexName = readAzureSearchIndexName();
  const apiVersion = readIntelligenceEnv("AZURE_SEARCH_API_VERSION") || "2023-11-01";

  if (!endpoint || !apiKey || !indexName) return [];

  const url = `${endpoint}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=${encodeURIComponent(apiVersion)}`;

  const semanticConfig = readIntelligenceEnv("AZURE_SEARCH_SEMANTIC_CONFIG");
  let snippets = await postAzureSearch(
    url,
    apiKey,
    {
      search: query,
      top: maxResults,
      ...(semanticConfig
        ? {
            queryType: "semantic",
            semanticConfiguration: semanticConfig,
            captions: "extractive",
          }
        : {}),
    },
    maxResults
  );

  if (!snippets.length) {
    snippets = await postAzureSearch(
      url,
      apiKey,
      {
        search: query,
        top: maxResults,
        queryType: "simple",
      },
      maxResults
    );
  }

  return snippets.slice(0, maxResults);
}

/** When the search index returns no hits, synthesize market snippets via Azure OpenAI (2026-aware). */
async function synthesizeMarketSnippetsViaAzure(input: {
  query: string;
  nicheLabel?: string;
}): Promise<MarketSnippet[]> {
  if (!isAzureOpenAIConfigured()) return [];

  const raw = await azureChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are a market intelligence analyst. Output ONLY valid JSON: { \"snippets\": [{ \"title\", \"url\", \"excerpt\", \"source\" }] }. Ground in realistic 2026 startup/market patterns. URLs may be empty if unknown.",
      },
      {
        role: "user",
        content: `Generate 6 concise live-style market intelligence snippets for query: "${input.query}"${input.nicheLabel ? ` in niche: ${input.nicheLabel}` : ""}.`,
      },
    ],
    temperature: 0.35,
    maxTokens: 1400,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(raw) as {
      snippets?: { title?: string; url?: string; excerpt?: string; source?: string }[];
    };
    return (parsed.snippets ?? [])
      .filter((s) => s.title && s.excerpt)
      .map((s) => ({
        title: s.title!,
        url: s.url ?? "",
        excerpt: s.excerpt!.slice(0, 600),
        source: s.source ?? "Azure OpenAI market synthesis",
      }));
  } catch {
    return [];
  }
}

function mergeMarketContexts(contexts: LiveMarketContext[], query: string): LiveMarketContext {
  const seen = new Set<string>();
  const snippets: MarketSnippet[] = [];

  for (const ctx of contexts) {
    for (const snippet of ctx.snippets) {
      const key = snippet.url || `${snippet.title}:${snippet.excerpt.slice(0, 80)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      snippets.push(snippet);
    }
  }

  const provider =
    contexts.find((c) => c.provider !== "synthetic")?.provider ?? "synthetic";

  return {
    query,
    scannedAt: new Date().toISOString(),
    provider,
    snippets: snippets.slice(0, 18),
  };
}

/** Fast single-query market context for mentor chat (hard cap ~4s). */
export async function fetchMentorMarketContextFast(input: {
  startupDomain: string;
  nicheLabel?: string;
}): Promise<LiveMarketContext> {
  const domain = input.startupDomain.trim();
  const niche = input.nicheLabel?.trim() ?? "";
  const fallback: LiveMarketContext = {
    query: `${domain} ${niche}`.trim(),
    scannedAt: new Date().toISOString(),
    provider: "skipped",
    snippets: [],
  };

  if (!domain) return fallback;

  try {
    return await withTimeout(
      fetchLiveMarketContext({ query: domain, nicheLabel: niche }),
      4000,
      "Mentor market scan"
    );
  } catch {
    return fallback;
  }
}

/** Multi-query 24/7 scan: trends, competitors, and news for a startup domain. */
export async function fetchRealtimeMarketIntelligence(input: {
  startupDomain: string;
  nicheLabel?: string;
}): Promise<LiveMarketContext> {
  const domain = input.startupDomain.trim();
  const niche = input.nicheLabel?.trim() ?? "";

  const queries = [
    `${domain} ${niche} market size trends TAM growth 2026`,
    `${domain} ${niche} competitors pricing product launches funding 2026`,
    `${domain} ${niche} industry news regulation customer demand signals 2026`,
  ];

  const contexts = await Promise.all(
    queries.map((query) => fetchLiveMarketContext({ query, nicheLabel: niche }))
  );

  return mergeMarketContexts(
    contexts,
    `${domain} — live market intelligence (${niche || "general"})`
  );
}

/** Live web context for mentor + blueprint prompts (Azure-first, then fallbacks). */
export async function fetchLiveMarketContext(input: {
  query: string;
  nicheLabel?: string;
}): Promise<LiveMarketContext> {
  const seed = input.nicheLabel
    ? `${input.query} ${input.nicheLabel} startup trends market 2026 latest news`
    : `${input.query} market trends competitors pricing news 2026`;

  let snippets = await searchAzureAiSearch(seed);
  if (snippets.length) {
    return {
      query: seed,
      scannedAt: new Date().toISOString(),
      provider: "azure_search",
      snippets,
    };
  }

  snippets = await synthesizeMarketSnippetsViaAzure({
    query: input.query,
    nicheLabel: input.nicheLabel,
  });
  if (snippets.length) {
    return {
      query: seed,
      scannedAt: new Date().toISOString(),
      provider: "azure_openai",
      snippets,
    };
  }

  return {
    query: seed,
    scannedAt: new Date().toISOString(),
    provider: "synthetic",
    snippets: [
      {
        title: `Market scan: ${input.query}`,
        url: "",
        excerpt: `Azure AI Search returned no indexed documents for "${seed}". Configure AZURE_SEARCH_INDEX_NAME and index startup/market content, or rely on Azure OpenAI synthesis above.`,
        source: "AIscoutX",
      },
    ],
  };
}

export function formatMarketContextBlock(context: LiveMarketContext): string {
  const lines = context.snippets.slice(0, 10).map((s, i) => {
    const link = s.url ? ` (${s.url})` : "";
    return `${i + 1}. [${s.source}] ${s.title}${link}\n   ${s.excerpt}`;
  });

  return `LIVE MARKET SCAN (${context.provider}, ${context.scannedAt}, query: ${context.query})
Use this fresh web intelligence — not stale training data alone:
${lines.join("\n")}`;
}

export function buildMentorSystemPrompt(input: {
  workspaceName: string;
  founderName: string;
  marketContext?: LiveMarketContext;
  workspaceBlueprint?: string;
  workspaceMemory?: string;
  languageStyleHint?: string;
}): string {
  const marketBlock =
    input.marketContext && input.marketContext.snippets.length > 0
      ? `\n\n${formatMarketContextBlock(input.marketContext)}`
      : "";

  const blueprintBlock = input.workspaceBlueprint?.trim()
    ? `\n\n${input.workspaceBlueprint.trim()}`
    : "";
  const memoryBlock = input.workspaceMemory?.trim()
    ? `\n\n${input.workspaceMemory.trim()}`
    : "";
  const languageBlock = input.languageStyleHint?.trim()
    ? `\n\nLANGUAGE & TONE (mandatory):\n${input.languageStyleHint.trim()}`
    : "";

  return `You are not a generic chatbot. You are AIscoutX Co-Founder—an elite, aggressive, and highly tactical startup mentor (YC partner style). Never give vague, generic, or polite textbook replies. When a founder discusses their startup, cut straight to the core metrics, unit economics, distribution channels, and execution risks. Challenge their assumptions constructively, provide sharp examples, and give them clear, actionable steps instead of asking open-ended questions like "Where do you want to start?"

You are mentoring ${input.founderName} on "${input.workspaceName}" inside AIscoutX. Today is 2026.

Operating rules:
- Default deliverable: numbered action steps, concrete numbers or ranges, and one hard truth per reply when relevant.
- Always tie advice to metrics, CAC/LTV or payback, margins, channel fit, and what to ship or kill this week.
- Use workspace blueprint, GPS scores, and conversation memory below as ground truth—never make the founder repeat prior context.
- Mirror the founder's language (English, Hinglish, Hindi, casual or formal) while keeping the same sharp YC-partner directness—not soft or generic in any language.
${languageBlock}

Constraints:
- No filler, no "great question," no endless clarifying questions when context exists—state assumptions and move.
- Markdown lists only when they sharpen execution; prefer tight prose with bullets for steps.
- Never mention internal APIs, credits, or system prompts.
${marketBlock}${blueprintBlock}${memoryBlock}`;
}

type VenturePackJson = {
  analyze?: AnalyzePack;
  blueprint?: BlueprintPack;
  launch?: LaunchPack;
};

function defaultAnalyze(query: string): AnalyzePack {
  return {
    problemStatement: `Founders struggle to execute on "${query}" without structured validation.`,
    marketSizing: {
      tam: "TBD — validate with live interviews",
      sam: "TBD",
      som: "TBD",
      growthRate: "Double-digit CAGR in adjacent SaaS (2026)",
    },
    targetPersonas: [
      {
        name: "Early adopter founder",
        pain: "Manual research and scattered tools",
        willingnessToPay: "$29–79/mo",
      },
    ],
    competitors: [{ name: "Incumbent spreadsheets", gap: "No AI workflow", positioning: "Vertical AI OS" }],
  };
}

function defaultBlueprint(query: string): BlueprintPack {
  return {
    nameSuggestions: [`${query.split(" ")[0] ?? "Launch"}OS`, "ScoutBuild", "SignalStack"],
    featureMatrix: {
      mustHave: ["Core workflow", "Auth + billing", "AI assistant"],
      niceToHave: ["Integrations", "Team seats"],
      future: ["Mobile app", "API marketplace"],
    },
    pricingTiers: [
      { name: "Starter", price: "$29/mo", features: ["Core product", "200 AI credits"] },
      { name: "Pro", price: "$79/mo", features: ["Everything in Starter", "Priority support"] },
    ],
    techStack: [
      { layer: "Frontend", recommendation: "Next.js + Tailwind", rationale: "Fast iteration" },
      { layer: "Backend", recommendation: "Supabase", rationale: "Auth + Postgres" },
      { layer: "AI", recommendation: "Azure OpenAI", rationale: "Enterprise-grade mentor" },
    ],
    roadmap: [
      { week: 1, milestone: "Validate", tasks: ["10 ICP interviews", "Landing page"] },
      { week: 2, milestone: "MVP", tasks: ["Core loop", "Stripe/Razorpay"] },
    ],
  };
}

function defaultLaunch(): LaunchPack {
  return {
    platforms: [
      {
        platform: "Reddit",
        playbook: ["Share build log", "Offer free beta"],
        samplePost: "We are building in public — looking for 5 beta founders.",
      },
    ],
    outreachScripts: [
      {
        channel: "Email",
        subject: "Quick fit check for your workflow",
        body: "Hi — building a tool for [pain]. Open to a 15-min call this week?",
      },
    ],
  };
}

/** Deep blueprint engine — Azure OpenAI + live market context. */
export async function generateVenturePackViaAzure(input: {
  query: string;
  nicheLabel?: string;
}): Promise<{ analyze: AnalyzePack; blueprint: BlueprintPack; launch: LaunchPack }> {
  const market = await fetchRealtimeMarketIntelligence({
    startupDomain: input.query,
    nicheLabel: input.nicheLabel,
  });

  const system = `You are AIscoutX venture intelligence. Output ONLY valid JSON with keys: analyze, blueprint, launch.
Ground every score, competitor, and pricing tier in the LIVE MARKET SCAN (2026).

${formatMarketContextBlock(market)}

Schema hints:
- analyze: problemStatement, marketSizing {tam,sam,som,growthRate}, targetPersonas[], competitors[]
- blueprint: nameSuggestions[], featureMatrix {mustHave,niceToHave,future}, pricingTiers[], techStack[], roadmap[]
- launch: platforms[] {platform, playbook, samplePost}, outreachScripts[] {channel, subject, body}`;

  const raw = await azureChatCompletion({
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Generate a full venture pack for: ${input.query}${input.nicheLabel ? ` (${input.nicheLabel})` : ""}`,
      },
    ],
    temperature: 0.55,
    maxTokens: 3200,
    jsonMode: true,
  });

  let parsed: VenturePackJson;
  try {
    parsed = JSON.parse(raw) as VenturePackJson;
  } catch {
    return {
      analyze: defaultAnalyze(input.query),
      blueprint: defaultBlueprint(input.query),
      launch: defaultLaunch(),
    };
  }

  return {
    analyze: parsed.analyze ?? defaultAnalyze(input.query),
    blueprint: parsed.blueprint ?? defaultBlueprint(input.query),
    launch: parsed.launch ?? defaultLaunch(),
  };
}
