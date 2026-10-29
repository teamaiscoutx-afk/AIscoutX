import { NextResponse } from "next/server";

import {
  azureChatCompletion,
  buildMentorSystemPrompt,
  fetchLiveMarketContext,
  isAzureOpenAIConfigured,
  type ChatMessage,
} from "@/lib/azure-ai";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  workspaceName?: string;
  founderName?: string;
  nicheLabel?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Auth is not configured." }, { status: 503 });
  }

  if (!isAzureOpenAIConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Azure OpenAI is not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME.",
      },
      { status: 503 }
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
  }

  const workspaceName = body.workspaceName?.trim() || "your startup";
  const founderName = body.founderName?.trim() || "Founder";
  const nicheLabel = body.nicheLabel?.trim();

  const deduction = await deductCreditsForAction(user.id, "chat");
  if (!deduction.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: deduction.message,
        code: deduction.error,
        credits: deduction.snapshot,
      },
      { status: deduction.error === "insufficient_credits" ? 402 : 503 }
    );
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (entry) =>
            entry &&
            (entry.role === "user" || entry.role === "assistant") &&
            typeof entry.content === "string"
        )
        .slice(-12)
    : [];

  try {
    const marketContext = await fetchLiveMarketContext({
      query: `${workspaceName}: ${message}`,
      nicheLabel,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: buildMentorSystemPrompt({ workspaceName, founderName, marketContext }),
      },
      ...history.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      { role: "user", content: message },
    ];

    const reply = await azureChatCompletion({ messages, temperature: 0.65, maxTokens: 1400 });

    const headers = new Headers();
    headers.set("X-Credits-Remaining", String(deduction.snapshot.remaining));
    headers.set("X-Credits-Allowance", String(deduction.snapshot.allowance));
    headers.set("X-Market-Scan-Provider", marketContext.provider);
    if (deduction.warning) {
      headers.set("X-Credits-Warning", deduction.warning);
    }

    return NextResponse.json(
      {
        ok: true,
        reply,
        credits: deduction.snapshot,
        warning: deduction.warning,
        marketScan: {
          provider: marketContext.provider,
          scannedAt: marketContext.scannedAt,
          resultCount: marketContext.snippets.length,
        },
      },
      { headers }
    );
  } catch (err) {
    await addBonusCredits(user.id, creditCostForAction("chat")).catch(() => undefined);
    logServerError("api.ai.chat", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "AI request failed." },
      { status: 502 }
    );
  }
}
