import { NextResponse } from "next/server";

import {
  azureChatCompletion,
  azureChatCompletionStream,
  buildMentorSystemPrompt,
  fetchMentorMarketContextFast,
  type AzureCompletionMessage,
} from "@/lib/azure-ai";
import { resolveServerAzureOpenAI } from "@/lib/server/azure-config.server";
import { createMentorChatSseStream } from "@/lib/server/mentor-chat-stream.server";
import { withTimeout } from "@/lib/server/with-timeout";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatBody = {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  workspaceId?: string;
  workspaceName?: string;
  founderName?: string;
  nicheLabel?: string;
  stream?: boolean;
  history?: { role: "user" | "assistant"; content: string }[];
};

const MAX_IMAGE_BASE64_CHARS = 6_000_000;
const MENTOR_LLM_TIMEOUT_MS = 55_000;

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
      {
        type: "text",
        text:
          text ||
          "Analyze this screenshot for my startup and give actionable mentor advice.",
      },
      { type: "image_url", image_url: { url: dataUrl, detail: "auto" } },
    ],
  };
}

function wantsEventStream(request: Request, body: ChatBody): boolean {
  const queryStream = new URL(request.url).searchParams.get("stream") === "1";
  const accept = request.headers.get("accept") ?? "";
  return body.stream === true || queryStream || accept.includes("text/event-stream");
}

function mentorCompletionSignal(): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(MENTOR_LLM_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), MENTOR_LLM_TIMEOUT_MS);
  return controller.signal;
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
  const useStream = wantsEventStream(request, body);

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

  const signal = mentorCompletionSignal();

  try {
    const marketContext = await fetchMentorMarketContextFast({
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

    const creditHeaders = {
      "X-Credits-Remaining": String(deduction.snapshot.remaining),
      "X-Credits-Allowance": String(deduction.snapshot.allowance),
      "X-Market-Scan-Provider": marketContext.provider,
      ...(deduction.warning ? { "X-Credits-Warning": deduction.warning } : {}),
    };

    if (useStream) {
      try {
        const azureResponse = await azureChatCompletionStream({
          messages,
          temperature: 0.65,
          maxTokens: 1200,
          signal,
        });

        const sse = createMentorChatSseStream({
          azureBody: azureResponse.body!,
          meta: {
            creditsRemaining: deduction.snapshot.remaining,
            creditsAllowance: deduction.snapshot.allowance,
            warning: deduction.warning,
          },
        });

        return new Response(sse, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            ...creditHeaders,
          },
        });
      } catch (streamErr) {
        logServerError("api.ai.chat.stream", streamErr);
        // Non-streaming fallback when Azure streaming fails.
      }
    }

    const reply = await withTimeout(
      azureChatCompletion({
        messages,
        temperature: 0.65,
        maxTokens: 1200,
        signal,
      }),
      MENTOR_LLM_TIMEOUT_MS,
      "Mentor completion"
    );

    const headers = new Headers(creditHeaders);
    if (useStream) {
      headers.set("X-Stream-Fallback", "json");
    }

    return NextResponse.json(
      {
        ok: true,
        reply,
        credits: deduction.snapshot,
        warning: deduction.warning,
        streamFallback: useStream,
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
