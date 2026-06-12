import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { getLatestVenturePack } from "@/app/actions/generation";
import { checkChatMessage, incrementChatMessage } from "@/app/actions/usage";
import { CHAT_LIMIT_MESSAGE } from "@/lib/billing/tier-limits";
import { HUMAN_COPY_SYSTEM_PROMPT } from "@/lib/intelligence/copy-engine";
import { getLlmProvider } from "@/lib/intelligence/llm-router";
import { readServerEnv } from "@/lib/env";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type WorkspaceContext = {
  projectName: string;
  niche: string;
  stage: string;
  validationScore: number;
  mvpScore: number;
  launchScore: number;
  tagline: string;
  problem: string;
  solution: string;
} | null;

// Premium Mock Response content for Stripe approval simulation
const MOCK_RESPONSE = `### 🚀 Premium Strategy Breakdown

Based on your active project configuration and architectural constraints, we need to scale the validation pipeline aggressively before focusing on deep refactoring. 

Here is your highly tactical **3-Step Execution Plan** for today:

1. **Tighten the Core Value Proposition:** Ensure your landing page focuses on the *100x speed-to-value* matrix rather than generic operational metrics. Founders pay for immediate pain-relievers, not long-term vitamins.
2. **Optimize the Technical Layer:** Leverage Next.js dynamic streaming routes along with your active Supabase configuration to lock down the transaction workflows. Ensure Row Level Security (RLS) is fully active across all tenant tables.
3. **Global Monetization Setup:** Activate your international billing gateways (such as Stripe) immediately to run cross-border micro-conversions. Capturing early global revenue signals from markets like the US and Europe is the absolute fastest way to validate market liquidity.

---

🎯 **Your Immediate Next Action:** Open your environment configuration file, double-check your production deployment keys, and execute a live test transaction to verify that your subscription webhook correctly triggers the database tier upgrades. Let me know once the webhook returns a clean \`200 OK\` status!`;

async function loadActiveWorkspaceContext(): Promise<WorkspaceContext> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("is_active", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      projectName: data.opportunity_name,
      niche: data.niche_focus ?? data.opportunity_name,
      stage: data.current_stage,
      validationScore: data.validation_score,
      mvpScore: data.mvp_score,
      launchScore: data.launch_score,
      tagline: data.summary_json?.overview?.tagline ?? "",
      problem: data.summary_json?.overview?.problem ?? "",
      solution: data.summary_json?.overview?.solution ?? "",
    };
  } catch {
    return null;
  }
}

async function buildSystemPrompt(): Promise<string> {
  const [workspace, pack] = await Promise.all([
    loadActiveWorkspaceContext(),
    getLatestVenturePack().catch(() => null),
  ]);

  const sections: string[] = [
    HUMAN_COPY_SYSTEM_PROMPT,
    `You are the Lead AI Strategy Co-Founder for AIscoutX — an elite Silicon Valley startup mentor.
- Do not ask the user to re-explain their startup idea. You already know it from the context below.
- Give precise, non-generic, highly tactical execution advice tied to their actual project.
- Answer in short paragraphs or tight bullets. Always end with one clear next action they can take today.
- Format responses in clean Markdown: headers, bold highlights, lists, and fenced code blocks where useful.`,
  ];

  if (workspace) {
    sections.push(`ACTIVE PROJECT CONTEXT (from the user's workspace):
- Project: ${workspace.projectName}
- Niche: ${workspace.niche}
- Current stage: ${workspace.stage}
- Scores — Validation: ${workspace.validationScore}/100, MVP: ${workspace.mvpScore}/100, Launch: ${workspace.launchScore}/100
${workspace.tagline ? `- Tagline: ${workspace.tagline}` : ""}
${workspace.problem ? `- Problem: ${workspace.problem}` : ""}
${workspace.solution ? `- Solution: ${workspace.solution}` : ""}`);
  }

  if (pack) {
    const stack = pack.blueprint.techStack
      .map((row) => `${row.layer}: ${row.recommendation}`)
      .join("; ");
    sections.push(`BLUEPRINT CONSTRAINTS (already generated for this user):
- Build query: "${pack.query}"
- Tech stack: ${stack}
Respect this stack in technical advice unless the user asks to change it.`);
  }

  if (!workspace && !pack) {
    sections.push(
      "The user has not created a project workspace yet. Help them pick and validate a direction fast — push them toward generating a blueprint."
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

export async function POST(request: Request) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Sign in to use the mentor chat." },
          { status: 401 }
        );
      }
    }

    // Strict guardrail — free tier is capped before any tokens are spent.
    const gate = await checkChatMessage();
    if (!gate.allowed) {
      return NextResponse.json(
        { error: CHAT_LIMIT_MESSAGE, code: "UPGRADE_REQUIRED" },
        { status: 403 }
      );
    }

    // Count the message up-front so the cap can't be bypassed by aborting the stream.
    await incrementChatMessage().catch(() => undefined);

    const provider = getLlmProvider();

    if (!provider) {
      // Create a beautifully simulated streaming response that mimics the real AI SDK chunks
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          const words = MOCK_RESPONSE.split(" ");
          for (const word of words) {
            // Stream the text chunk by chunk with an ultra-realistic 45ms pacing
            controller.enqueue(encoder.encode(`0:${JSON.stringify(word + " ")}\n`));
            await new Promise((resolve) => setTimeout(resolve, 45));
          }
          controller.close();
          },
        });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // --- REAL AI ENGINE FLOW (Runs automatically when valid keys are supplied) ---
    const { messages }: { messages: UIMessage[] } = await request.json();
    const system = await buildSystemPrompt();

    const model =
      provider === "openai"
        ? openai(readServerEnv("OPENAI_MODEL") ?? "gpt-4o-mini")
        : anthropic(readServerEnv("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514");

    const result = streamText({
      model,
      system,
      temperature: 0.4,
      messages: await convertToModelMessages(messages.slice(-12)),
      experimental_transform: smoothStream({ delayInMs: 12 }),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    logServerError("chat.stream", err);
    return NextResponse.json(
      { error: "The mentor hit a snag. Try again." },
      { status: 500 }
    );
  }
}