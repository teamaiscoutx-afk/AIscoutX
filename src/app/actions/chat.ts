"use server";

import { HUMAN_COPY_SYSTEM_PROMPT, scrubBannedVocabulary } from "@/lib/intelligence/copy-engine";
import { isIntelligenceEngineReady } from "@/lib/intelligence/config";
import { getLlmProvider } from "@/lib/intelligence/llm-router";

const FOUNDER_CHAT_SYSTEM = `${HUMAN_COPY_SYSTEM_PROMPT}

You are the AI Founder Chat strategist inside AIscoutX.
- Answer in 2-4 short paragraphs or bullets.
- Be direct. No fluff.
- Give one clear next action the founder can take today.`;

export async function sendFounderChatMessage(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Enter a message." };

  if (!isIntelligenceEngineReady()) {
    return {
      ok: false,
      error: "Chat requires OPENAI_API_KEY or ANTHROPIC_API_KEY.",
    };
  }

  const provider = getLlmProvider();
  const recent = history.slice(-6);

  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: FOUNDER_CHAT_SYSTEM },
            ...recent.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!res.ok) {
        return { ok: false, error: "OpenAI request failed." };
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = scrubBannedVocabulary(
        data.choices?.[0]?.message?.content?.trim() ?? ""
      );
      return { ok: true, reply };
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.3,
        system: FOUNDER_CHAT_SYSTEM,
        messages: [
          ...recent.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: trimmed },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: "Anthropic request failed." };
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const reply = scrubBannedVocabulary(
      data.content?.find((c) => c.type === "text")?.text?.trim() ?? ""
    );
    return { ok: true, reply };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return { ok: false, error: msg };
  }
}
