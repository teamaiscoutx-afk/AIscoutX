import type { ChannelSearchResult, SearchChannel, WebSnippet } from "@/lib/intelligence/types";
import { readServerEnv } from "@/lib/env";

const COMPLAINT_TERMS = [
  "pain",
  "frustrated",
  "hate",
  "broken",
  "missing",
  "wish",
  "problem",
  "alternative",
  "sucks",
  "terrible",
];

type RawHit = {
  title: string;
  url: string;
  content: string;
  publishedAt?: string;
};

function channelLabel(channel: SearchChannel): string {
  const map: Record<SearchChannel, string> = {
    reddit: "Reddit",
    x: "X",
    google: "Google",
    youtube: "YouTube",
    producthunt: "Product Hunt",
    github: "GitHub",
  };
  return map[channel];
}

function buildChannelQuery(seed: string, channel: SearchChannel): string {
  const base = seed.trim();
  const complaint = COMPLAINT_TERMS.slice(0, 3).join(" OR ");
  switch (channel) {
    case "reddit":
      return `site:reddit.com ${base} (${complaint})`;
    case "x":
      return `site:x.com OR site:twitter.com ${base} (${complaint})`;
    case "youtube":
      return `site:youtube.com ${base} review OR tutorial OR problem`;
    case "producthunt":
      return `site:producthunt.com ${base}`;
    case "github":
      return `site:github.com ${base} stars:>10`;
    default:
      return `${base} startup opportunity ${complaint} past month`;
  }
}

function hitsToSnippets(hits: RawHit[], channel: SearchChannel): WebSnippet[] {
  return hits.map((h) => ({
    source: channelLabel(channel),
    title: h.title,
    excerpt: h.content.slice(0, 600),
    url: h.url,
    publishedAt: h.publishedAt,
  }));
}

async function searchTavily(query: string, maxResults = 8): Promise<RawHit[]> {
  const apiKey = readServerEnv("TAVILY_API_KEY");
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
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: { title: string; url: string; content: string; published_date?: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedAt: r.published_date,
  }));
}

async function searchSerper(query: string, maxResults = 8): Promise<RawHit[]> {
  const apiKey = readServerEnv("SERPER_API_KEY");
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: maxResults, tbs: "qdr:m" }),
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    organic?: { title: string; link: string; snippet: string; date?: string }[];
  };

  return (data.organic ?? []).map((r) => ({
    title: r.title,
    url: r.link,
    content: r.snippet,
    publishedAt: r.date,
  }));
}

async function searchPerplexity(query: string): Promise<RawHit[]> {
  const apiKey = readServerEnv("PERPLEXITY_API_KEY");
  if (!apiKey) return [];

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `Search the live web for: ${query}. Return only factual recent results with URLs.`,
        },
      ],
      temperature: 0.1,
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    citations?: string[];
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const citations = data.citations ?? [];

  return citations.slice(0, 8).map((url, i) => ({
    title: `Source ${i + 1}`,
    url,
    content: content.slice(0, 400),
  }));
}

async function runQuery(query: string, maxResults = 8): Promise<RawHit[]> {
  if (readServerEnv("TAVILY_API_KEY")) {
    const hits = await searchTavily(query, maxResults);
    if (hits.length) return hits;
  }
  if (readServerEnv("SERPER_API_KEY")) {
    const hits = await searchSerper(query, maxResults);
    if (hits.length) return hits;
  }
  if (readServerEnv("PERPLEXITY_API_KEY")) {
    const hits = await searchPerplexity(query);
    if (hits.length) return hits;
  }
  return [];
}

export function getWebSearchProvider(): "tavily" | "serper" | "perplexity" | null {
  if (readServerEnv("TAVILY_API_KEY")) return "tavily";
  if (readServerEnv("SERPER_API_KEY")) return "serper";
  if (readServerEnv("PERPLEXITY_API_KEY")) return "perplexity";
  return null;
}

export function isWebSearchConfigured(): boolean {
  return getWebSearchProvider() !== null;
}

export async function searchChannel(
  seed: string,
  channel: SearchChannel
): Promise<ChannelSearchResult> {
  const query = buildChannelQuery(seed, channel);
  const hits = await runQuery(query, 8);
  const snippets = hitsToSnippets(hits, channel);

  return {
    channel,
    query,
    snippets,
    resultCount: snippets.length,
  };
}

export async function searchAllChannels(seed: string): Promise<ChannelSearchResult[]> {
  const channels: SearchChannel[] = [
    "reddit",
    "x",
    "google",
    "youtube",
    "producthunt",
    "github",
  ];

  const results = await Promise.all(
    channels.map((channel) => searchChannel(seed, channel))
  );

  return results;
}

export function flattenSnippets(results: ChannelSearchResult[]): WebSnippet[] {
  const seen = new Set<string>();
  const flat: WebSnippet[] = [];

  for (const result of results) {
    for (const snippet of result.snippets) {
      if (seen.has(snippet.url)) continue;
      seen.add(snippet.url);
      flat.push(snippet);
    }
  }

  return flat;
}

export function countComplaintSignals(snippets: WebSnippet[]): number {
  const pattern = new RegExp(COMPLAINT_TERMS.join("|"), "i");
  return snippets.filter(
    (s) => pattern.test(s.title) || pattern.test(s.excerpt)
  ).length;
}
