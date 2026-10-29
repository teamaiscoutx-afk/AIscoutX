import { NextResponse } from "next/server";

import { azureChatCompletion, isAzureOpenAIConfigured, type ChatMessage } from "@/lib/ai/azure-openai";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  action?: "chat" | "blueprint";
  workspaceName?: string;
  founderName?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

function buildMentorSystemPrompt(input: {
  workspaceName: string;
  founderName: string;
}): string {
  return `You are the elite empathetic Lead Tech Co-Founder for AIscoutX mentoring ${input.founderName} on their startup "${input.workspaceName}".

Operational laws:
- Reply like a world-class no-code mentor using conversational, accessible Hinglish (clean Hindi + English mix).
- Be structural, actionable, and concise. Use markdown sparingly for lists and emphasis.
- Anchor advice to validation, MVP scope, GTM, and unit economics for their niche.
- Never mention internal credit systems or API providers.`;
}

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

  const action = body.action === "blueprint" ? "blueprint" : "chat";
  const workspaceName = body.workspaceName?.trim() || "your startup";
  const founderName = body.founderName?.trim() || "Founder";

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

  const messages: ChatMessage[] = [
    { role: "system", content: buildMentorSystemPrompt({ workspaceName, founderName }) },
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: "user", content: message },
  ];

  const deduction = await deductCreditsForAction(user.id, action);
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

  try {
    const reply = await azureChatCompletion({ messages, temperature: 0.65 });

    const headers = new Headers();
    headers.set("X-Credits-Remaining", String(deduction.snapshot.remaining));
    headers.set("X-Credits-Allowance", String(deduction.snapshot.allowance));
    if (deduction.warning) {
      headers.set("X-Credits-Warning", deduction.warning);
    }

    return NextResponse.json(
      {
        ok: true,
        reply,
        credits: deduction.snapshot,
        warning: deduction.warning,
      },
      { headers }
    );
  } catch (err) {
    await addBonusCredits(user.id, creditCostForAction(action)).catch(() => undefined);
    logServerError("api.ai.chat", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "AI request failed." },
      { status: 502 }
    );
  }
}
