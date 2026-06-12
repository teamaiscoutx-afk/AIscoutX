import {
  BANNED_VOCABULARY,
  HUMAN_COPY_SYSTEM_PROMPT,
  scrubBannedVocabulary,
} from "@/lib/intelligence/copy-engine";
import { readIntelligenceEnv } from "@/lib/env";

export type LlmProvider = "openai" | "anthropic";

export function getLlmProvider(): LlmProvider | null {
  if (readIntelligenceEnv("OPENAI_API_KEY")) return "openai";
  if (readIntelligenceEnv("ANTHROPIC_API_KEY")) return "anthropic";
  return null;
}

export function isLlmConfigured(): boolean {
  return getLlmProvider() !== null;
}

async function callOpenAi(system: string, user: string): Promise<string> {
  const apiKey = readIntelligenceEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: readIntelligenceEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const apiKey = readIntelligenceEnv("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: readIntelligenceEnv("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.2,
      system: `${system}\n\nRespond with valid JSON only.`,
      messages: [{ role: "user", content: user }],
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return data.content?.find((c) => c.type === "text")?.text ?? "";
}

export async function synthesizeJson<T>(
  taskPrompt: string,
  evidenceBlock: string
): Promise<T> {
  const provider = getLlmProvider();
  if (!provider) {
    throw new Error(
      "No LLM configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
    );
  }

  const user = `${taskPrompt}\n\n${evidenceBlock}\n\nBanned words: ${BANNED_VOCABULARY.join(", ")}`;

  const raw =
    provider === "openai"
      ? await callOpenAi(HUMAN_COPY_SYSTEM_PROMPT, user)
      : await callAnthropic(HUMAN_COPY_SYSTEM_PROMPT, user);

  const cleaned = scrubBannedVocabulary(raw.trim());

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("LLM returned non-JSON output");
    return JSON.parse(match[0]) as T;
  }
}
