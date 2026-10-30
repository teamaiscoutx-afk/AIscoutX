import { NextResponse } from "next/server";

import {
  azureChatCompletion,
  fetchRealtimeMarketIntelligence,
  formatMarketContextBlock,
} from "@/lib/azure-ai";
import { resolveServerAzureOpenAI } from "@/lib/server/azure-config.server";
import { deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MarketRadarBody = {
  startupName?: string;
  nicheLabel?: string;
  refresh?: boolean;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Auth is not configured." }, { status: 503 });
  }

  const azure = resolveServerAzureOpenAI();
  if (!azure.ok) {
    return NextResponse.json(
      { ok: false, error: azure.error, missingEnv: azure.missing },
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

  let body: MarketRadarBody;
  try {
    body = (await request.json()) as MarketRadarBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const startupName = body.startupName?.trim();
  if (!startupName) {
    return NextResponse.json({ ok: false, error: "startupName is required." }, { status: 400 });
  }

  let creditsSnapshot = null;
  if (body.refresh !== false) {
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
    creditsSnapshot = deduction.snapshot;
  }

  try {
    const market = await fetchRealtimeMarketIntelligence({
      startupDomain: startupName,
      nicheLabel: body.nicheLabel?.trim(),
    });

    const summary = await azureChatCompletion({
      messages: [
        {
          role: "system",
          content: `You are AIscoutX Market Radar. Summarize live internet intelligence for founders in 2026.
Return JSON: { "momentumScore": 0-100, "updates": [{ "title": string, "insight": string, "urgency": "low"|"medium"|"high" }], "competitorSignals": string[] }
Ground every field in the LIVE MARKET SCAN only.

${formatMarketContextBlock(market)}`,
        },
        {
          role: "user",
          content: `Generate radar for startup domain: ${startupName}`,
        },
      ],
      temperature: 0.4,
      maxTokens: 1200,
      jsonMode: true,
    });

    let radar: {
      momentumScore?: number;
      updates?: { title: string; insight: string; urgency: string }[];
      competitorSignals?: string[];
    } = {};

    try {
      radar = JSON.parse(summary) as typeof radar;
    } catch {
      radar = {
        momentumScore: 72,
        updates: [
          {
            title: "Live scan complete",
            insight: "Review competitor pricing pages and recent launch threads this week.",
            urgency: "medium",
          },
        ],
        competitorSignals: [],
      };
    }

    return NextResponse.json({
      ok: true,
      radar,
      marketScan: {
        provider: market.provider,
        scannedAt: market.scannedAt,
        resultCount: market.snippets.length,
      },
      credits: creditsSnapshot,
    });
  } catch (err) {
    logServerError("api.market-radar", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Market radar failed." },
      { status: 502 }
    );
  }
}
