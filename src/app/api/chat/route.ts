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
    const provider = getLlmProvider();
    if (!provider) {
      return NextResponse.json(
        { error: "Chat requires OPENAI_API_KEY or ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

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

    const { messages }: { messages: UIMessage[] } = await request.json();
    const system = await buildSystemPrompt();

    const model =
      provider === "openai"
        ? openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini")
        : anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514");

    // Count the message up-front so the cap can't be bypassed by aborting the stream.
    await incrementChatMessage().catch(() => undefined);

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
