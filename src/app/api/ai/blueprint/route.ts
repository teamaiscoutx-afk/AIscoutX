import { NextResponse } from "next/server";

import {
  generateVenturePackViaAzure,
  isAzureOpenAIConfigured,
} from "@/lib/azure-ai";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlueprintBody = {
  query?: string;
  nicheLabel?: string;
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

  let body: BlueprintBody;
  try {
    body = (await request.json()) as BlueprintBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ ok: false, error: "Query is required." }, { status: 400 });
  }

  const deduction = await deductCreditsForAction(user.id, "blueprint");
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
    const pack = await generateVenturePackViaAzure({
      query,
      nicheLabel: body.nicheLabel?.trim(),
    });

    const headers = new Headers();
    headers.set("X-Credits-Remaining", String(deduction.snapshot.remaining));
    headers.set("X-Credits-Allowance", String(deduction.snapshot.allowance));
    if (deduction.warning) {
      headers.set("X-Credits-Warning", deduction.warning);
    }

    return NextResponse.json(
      {
        ok: true,
        analyze: pack.analyze,
        blueprint: pack.blueprint,
        launch: pack.launch,
        credits: deduction.snapshot,
        warning: deduction.warning,
      },
      { headers }
    );
  } catch (err) {
    await addBonusCredits(user.id, creditCostForAction("blueprint")).catch(() => undefined);
    logServerError("api.ai.blueprint", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Blueprint generation failed." },
      { status: 502 }
    );
  }
}
