import { NextResponse } from "next/server";

import { generateVenturePackViaAzure } from "@/lib/azure-ai";
import { generateFounderBlueprintDeepDive } from "@/lib/intelligence/founder-blueprint-azure";
import { resolveServerAzureOpenAI } from "@/lib/server/azure-config.server";
import { creditCostForAction } from "@/lib/billing/credit-costs";
import { addBonusCredits, deductCreditsForAction } from "@/lib/billing/credit-engine.server";
import { logServerError } from "@/lib/server/safe-action";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlueprintBody = {
  query?: string;
  nicheLabel?: string;
  mode?: "venture" | "founder";
  opportunity?: {
    id?: string;
    name?: string;
    category?: string;
    keywords?: string[];
    revenuePotential?: string;
    founderProblem?: string;
    founderSolution?: string;
    founderMvp?: string;
  };
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

  let body: BlueprintBody;
  try {
    body = (await request.json()) as BlueprintBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const mode = body.mode ?? (body.opportunity?.name ? "founder" : "venture");
  const query =
    body.query?.trim() ||
    body.opportunity?.name?.trim() ||
    "";

  if (!query) {
    return NextResponse.json({ ok: false, error: "Query or opportunity name is required." }, { status: 400 });
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
    const headers = new Headers();
    headers.set("X-Credits-Remaining", String(deduction.snapshot.remaining));
    headers.set("X-Credits-Allowance", String(deduction.snapshot.allowance));
    if (deduction.warning) {
      headers.set("X-Credits-Warning", deduction.warning);
    }

    if (mode === "founder") {
      const deepDive = await generateFounderBlueprintDeepDive({
        name: body.opportunity?.name ?? query,
        category: body.opportunity?.category ?? "Startup",
        keywords: body.opportunity?.keywords ?? [],
        nicheLabel: body.nicheLabel?.trim(),
        founderProblem: body.opportunity?.founderProblem,
        founderSolution: body.opportunity?.founderSolution,
        founderMvp: body.opportunity?.founderMvp,
        revenuePotential: body.opportunity?.revenuePotential,
      });

      return NextResponse.json(
        {
          ok: true,
          mode: "founder",
          deepDive,
          credits: deduction.snapshot,
          warning: deduction.warning,
        },
        { headers }
      );
    }

    const pack = await generateVenturePackViaAzure({
      query,
      nicheLabel: body.nicheLabel?.trim(),
    });

    return NextResponse.json(
      {
        ok: true,
        mode: "venture",
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
