import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";
import { readIntelligenceEnv } from "@/lib/env";

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
  provider: "azure_search" | "bing" | "tavily" | "serper" | "synthetic";
  snippets: MarketSnippet[];
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

export function isAzureSearchConfigured(): boolean {
  return Boolean(
    process.env.AZURE_SEARCH_ENDPOINT?.trim() &&
      process.env.AZURE_SEARCH_API_KEY?.trim() &&
      process.env.AZURE_SEARCH_INDEX_NAME?.trim()
  );
}

export function isAzureBingSearchConfigured(): boolean {
  return Boolean(
    process.env.AZURE_BING_SEARCH_KEY?.trim() ||
      process.env.BING_SEARCH_V7_SUBSCRIPTION_KEY?.trim()
  );
}

/** Azure OpenAI chat completions (deployment-scoped). */
export async function azureChatCompletion(input: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
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

async function searchAzureAiSearch(query: string, maxResults = 8): Promise<MarketSnippet[]> {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT?.trim()?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_SEARCH_API_KEY?.trim();
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME?.trim();
  const apiVersion = process.env.AZURE_SEARCH_API_VERSION?.trim() || "2023-11-01";

  if (!endpoint || !apiKey || !indexName) return [];

  const url = `${endpoint}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=${encodeURIComponent(apiVersion)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      search: query,
      top: maxResults,
      queryType: "semantic",
      semanticConfiguration: process.env.AZURE_SEARCH_SEMANTIC_CONFIG?.trim() || undefined,
      captions: "extractive",
    }),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    value?: Record<string, unknown>[];
  };

  return (data.value ?? []).map((doc, i) => {
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

async function searchAzureBing(query: string, maxResults = 8): Promise<MarketSnippet[]> {
  const apiKey =
    process.env.AZURE_BING_SEARCH_KEY?.trim() ||
    process.env.BING_SEARCH_V7_SUBSCRIPTION_KEY?.trim();
  if (!apiKey) return [];

  const endpoint =
    process.env.AZURE_BING_SEARCH_ENDPOINT?.trim() ||
    "https://api.bing.microsoft.com/v7.0/search";

  const url = `${endpoint}?q=${encodeURIComponent(query)}&count=${maxResults}&mkt=en-US&freshness=Month`;

  const response = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    webPages?: {
      value?: { name?: string; url?: string; snippet?: string; dateLastCrawled?: string }[];
    };
  };

  return (data.webPages?.value ?? []).map((page) => ({
    title: page.name ?? "Web result",
    url: page.url ?? "",
    excerpt: (page.snippet ?? "").slice(0, 600),
    source: "Bing Web Search",
    publishedAt: page.dateLastCrawled,
  }));
}

async function searchTavilyFallback(query: string, maxResults = 8): Promise<MarketSnippet[]> {
  const apiKey = readIntelligenceEnv("TAVILY_API_KEY");
  if (!apiKey) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
      days: 30,
    }),
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: { title: string; url: string; content: string; published_date?: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    excerpt: r.content.slice(0, 600),
    source: "Tavily",
    publishedAt: r.published_date,
  }));
}

/** Live web context for mentor + blueprint prompts (Azure-first, then fallbacks). */
export async function fetchLiveMarketContext(input: {
  query: string;
  nicheLabel?: string;
}): Promise<LiveMarketContext> {
  const seed = input.nicheLabel
    ? `${input.query} ${input.nicheLabel} startup trends market 2026`
    : `${input.query} market trends competitors pricing 2026`;

  let snippets = await searchAzureAiSearch(seed);
  if (snippets.length) {
    return {
      query: seed,
      scannedAt: new Date().toISOString(),
      provider: "azure_search",
      snippets,
    };
  }

  snippets = await searchAzureBing(seed);
  if (snippets.length) {
    return {
      query: seed,
      scannedAt: new Date().toISOString(),
      provider: "bing",
      snippets,
    };
  }

  snippets = await searchTavilyFallback(seed);
  if (snippets.length) {
    return {
      query: seed,
      scannedAt: new Date().toISOString(),
      provider: "tavily",
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
        excerpt: `No live search keys returned data. Synthesize using current 2026 SaaS patterns for "${input.query}" and validate with founder interviews.`,
        source: "AIscoutX fallback",
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
}): string {
  const marketBlock = input.marketContext
    ? `\n\n${formatMarketContextBlock(input.marketContext)}`
    : "";

  return `You are the elite empathetic Lead Tech Co-Founder for AIscoutX mentoring ${input.founderName} on "${input.workspaceName}".

Today is 2026. Ground recommendations in the live market scan below when present.
${marketBlock}

Operational laws:
- Reply like a world-class no-code mentor using conversational, accessible Hinglish (clean Hindi + English mix).
- Be structural, actionable, and concise. Use markdown sparingly for lists and emphasis.
- Anchor advice to validation, MVP scope, GTM, and unit economics for their niche.
- Cite trends from the live scan when relevant; never mention internal APIs or credit systems.`;
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
  const market = await fetchLiveMarketContext({
    query: input.query,
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
