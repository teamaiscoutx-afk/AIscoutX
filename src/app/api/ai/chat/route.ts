import { NextResponse } from "next/server";

import {
  azureChatCompletion,
  buildMentorSystemPrompt,
  fetchRealtimeMarketIntelligence,
  type AzureCompletionMessage,
} from "@/lib/azure-ai";
import { resolveServerAzureOpenAI } from "@/lib/server/azure-config.server";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  workspaceId?: string;
  workspaceName?: string;
  founderName?: string;
  nicheLabel?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

const MAX_IMAGE_BASE64_CHARS = 6_000_000;

function buildUserTurn(input: {
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
}): AzureCompletionMessage {
  const text = input.message.trim();
  if (!input.imageBase64) {
    return { role: "user", content: text };
  }

  const mime =
    input.imageMimeType?.trim().startsWith("image/") === true
      ? input.imageMimeType.trim()
      : "image/png";
  const dataUrl = `data:${mime};base64,${input.imageBase64}`;

  return {
    role: "user",
    content: [
      { type: "text", text: text || "Analyze this screenshot for my startup and give actionable mentor advice." },
      { type: "image_url", image_url: { url: dataUrl, detail: "auto" } },
    ],
  };
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Auth is not configured." }, { status: 503 });
  }

  const azure = resolveServerAzureOpenAI();
  if (!azure.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: azure.error,
        missingEnv: azure.missing,
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

  const message = body.message?.trim() ?? "";
  const imageBase64 = body.imageBase64?.trim();
  const imageMimeType = body.imageMimeType?.trim();

  if (!message && !imageBase64) {
    return NextResponse.json(
      { ok: false, error: "Message or image attachment is required." },
      { status: 400 }
    );
  }

  if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return NextResponse.json({ ok: false, error: "Image is too large." }, { status: 413 });
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
    const marketContext = await fetchRealtimeMarketIntelligence({
      startupDomain: workspaceName,
      nicheLabel,
    });

    const messages: AzureCompletionMessage[] = [
      {
        role: "system",
        content: buildMentorSystemPrompt({ workspaceName, founderName, marketContext }),
      },
      ...history.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      buildUserTurn({ message, imageBase64, imageMimeType }),
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
