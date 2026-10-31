import type { PersistedMentorChat } from "@/app/actions/workspace-chats";
import {
  computeGlobalProgress,
  deriveNextAction,
  type StartupWorkspace,
} from "@/lib/founder/types";

const MAX_MEMORY_CHARS = 12_000;
const MAX_ACTIVE_THREAD_MESSAGES = 36;

export function detectLanguageStyleHint(recentUserText: string): string {
  const sample = recentUserText.trim().slice(0, 1200);
  if (!sample) {
    return "Mirror the founder's next message language and tone exactly.";
  }

  const devanagari = (sample.match(/[\u0900-\u097F]/g) ?? []).length;
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length;
  const hinglishCue =
    /\b(kya|hai|kaise|kaisa|bhai|yaar|nahi|nahin|accha|theek|mast|chalo|arre|batao|samjha|samjhao)\b/i.test(
      sample
    );
  const casualCue = /\b(lol|btw|imo|tbh|ngl|kinda|gonna|wanna|bro|dude)\b/i.test(sample);
  const formalCue = /\b(please|kindly|regarding|furthermore|deliverable|stakeholder)\b/i.test(
    sample
  );

  if (devanagari > 8 && latin > 20) {
    return "User writes in Hinglish (Hindi + English). Reply in the same Hinglish mix, natural and conversational.";
  }
  if (devanagari > latin) {
    return "User writes primarily in Hindi (Devanagari). Reply in Hindi unless they used English — match their script.";
  }
  if (hinglishCue) {
    return "User uses Hinglish phrasing. Reply in Hinglish with the same casual register.";
  }
  if (formalCue && !casualCue) {
    return "User tone is professional/formal. Reply with crisp, executive clarity — still warm, not stiff.";
  }
  if (casualCue) {
    return "User tone is casual/tech-slang. Reply with friendly founder-to-founder slang, still actionable.";
  }
  return "User writes in English. Match their formality level and vocabulary precisely.";
}

export function formatWorkspaceBlueprintContext(workspace: StartupWorkspace): string {
  const s = workspace.summary;
  const progress = computeGlobalProgress(workspace);
  const next = deriveNextAction(workspace);

  return `STARTUP BLUEPRINT & METRICS (authoritative workspace context)
Venture: ${workspace.opportunityName}
Stage: ${workspace.currentStage}
GPS scores — validation ${workspace.validationScore}/100, MVP ${workspace.mvpScore}/100, launch ${workspace.launchScore}/100, sales ${workspace.salesScore}/100 (global ${progress}/100)
Niche: ${workspace.nicheFocus ?? "General"}

Overview
- Tagline: ${s.overview.tagline}
- Problem: ${s.overview.problem}
- Solution: ${s.overview.solution}
- Target customer: ${s.overview.targetCustomer}

Validation hypotheses: ${s.validation.hypotheses.join(" | ") || "—"}
MVP must-have: ${s.mvp.mustHave.join("; ") || "—"}
MVP must-NOT: ${s.mvp.mustNot.join("; ") || "—"}
Competitive gap: ${s.competitors.marketGap || "—"}
Launch channels: ${s.launch.channels.join(", ") || "—"}
Revenue model: ${s.revenue.pricingModel || "—"} (${s.revenue.tiers.map((t) => `${t.name} ${t.price}`).join(", ") || "—"})

Current priority (${next.vector}): ${next.title} — ${next.description}
Suggested next task: ${next.taskText}`;
}

export function buildWorkspaceChatMemoryDigest(
  chats: PersistedMentorChat[],
  activeChatId?: string
): string {
  const visible = chats.filter((c) => !c.isDeleted);
  if (!visible.length) return "";

  const lines: string[] = [
    "WORKSPACE CONVERSATION MEMORY (other threads + prior context in this workspace):",
  ];

  for (const chat of visible) {
    const marker = chat.id === activeChatId ? " [ACTIVE THREAD]" : "";
    lines.push(`\n— Thread: "${chat.title}"${marker}`);
    const msgs = (chat.messages ?? []).filter(
      (m) => m.role === "user" || m.role === "assistant"
    );
    const tail = msgs.slice(-6);
    for (const m of tail) {
      lines.push(`${m.role === "user" ? "Founder" : "Mentor"}: ${m.content.slice(0, 500)}`);
    }
  }

  let digest = lines.join("\n");
  if (digest.length > MAX_MEMORY_CHARS) {
    digest = `${digest.slice(0, MAX_MEMORY_CHARS)}\n… [memory truncated]`;
  }
  return digest;
}

export function mergeActiveThreadHistory(input: {
  chats: PersistedMentorChat[];
  activeChatId?: string;
  clientHistory: { role: "user" | "assistant"; content: string }[];
}): { role: "user" | "assistant"; content: string }[] {
  const active = input.chats.find((c) => c.id === input.activeChatId && !c.isDeleted);
  const fromDb = (active?.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const merged =
    fromDb.length >= input.clientHistory.length ? fromDb : input.clientHistory;

  return merged.slice(-MAX_ACTIVE_THREAD_MESSAGES);
}
