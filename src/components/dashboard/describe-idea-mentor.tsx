"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageSquare, Rocket, Sparkles } from "lucide-react";

import { dispatchCreditsUpdated } from "@/lib/billing/credits-events";
import { dispatchOutOfCredits } from "@/lib/billing/freemium";
import { Button } from "@/components/ui/button";

const MENTOR_SEED_KEY = "aiscoutx_mentor_idea_seed";

type ChatLine = { role: "user" | "assistant"; content: string };

type DescribeIdeaMentorProps = {
  nicheLabel?: string;
  workspaceHref?: string | null;
};

export function DescribeIdeaMentor({
  nicheLabel = "Startup",
  workspaceHref,
}: DescribeIdeaMentorProps) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const ideaSummary =
    messages.find((m) => m.role === "user")?.content?.trim() || draft.trim();

  async function sendToMentor() {
    const text = draft.trim();
    if (!text || pending) return;

    setError(null);
    setPending(true);
    const nextUser: ChatLine = { role: "user", content: text };
    const history = [...messages, nextUser];
    setMessages(history);
    setDraft("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          action: "chat",
          workspaceName: ideaSummary.slice(0, 80) || "New idea",
          founderName: "Founder",
          nicheLabel,
          history: messages,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
      };

      dispatchCreditsUpdated();

      if (response.status === 402) {
        dispatchOutOfCredits();
        setError("You are out of credits. Choose a plan to continue.");
        return;
      }

      if (!response.ok || !payload.ok || !payload.reply) {
        setError(payload.error ?? "Mentor is unavailable. Try again.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply! }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      setError("Network error. Please retry.");
    } finally {
      setPending(false);
    }
  }

  function persistIdeaAndGo(href: string) {
    if (ideaSummary) {
      sessionStorage.setItem(
        MENTOR_SEED_KEY,
        JSON.stringify({ idea: ideaSummary, messages, savedAt: Date.now() })
      );
    }
    router.push(href);
  }

  const canEnterWorkspace = Boolean(workspaceHref);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduceMotion
          ? undefined
          : { boxShadow: "0 0 48px rgba(163,230,53,0.12), 0 24px 64px rgba(0,0,0,0.35)" }
      }
      className="glass-panel relative overflow-hidden rounded-2xl border border-[#A3E635]/25 p-6 transition-[border-color,box-shadow] duration-300 hover:border-[#A3E635]/35 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(163,230,53,0.1),transparent_70%)]"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[#A3E635]">
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            Live AI mentor
          </p>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          Describe your idea
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Share your startup concept in detail. Your mentor will discuss market demand,
          viability, and real-time trends—grounded in live web intelligence.
        </p>

        {messages.length > 0 && (
          <div className="mt-5 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/30 p-4 scrollbar-thin sm:p-5">
            {messages.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={`text-sm leading-relaxed ${
                  line.role === "user" ? "text-zinc-200" : "text-zinc-400"
                }`}
              >
                <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-[#A3E635]">
                  {line.role === "user" ? "You" : "Mentor"}
                </span>
                {line.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 transition-colors duration-300 focus-within:border-[#A3E635]/35 focus-within:bg-[#A3E635]/[0.04]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={pending}
              rows={4}
              placeholder="Describe the problem, audience, and what you want to build…"
              className="glass-input block min-h-[7.25rem] w-full resize-none rounded-[10px] border-0 bg-transparent p-4 text-left text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-0 sm:px-5 sm:py-4"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              disabled={pending || !draft.trim()}
              onClick={() => void sendToMentor()}
              className="h-11 bg-[#A3E635] text-zinc-950 hover:bg-[#84CC16]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mentor thinking…
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Ask Mentor
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canEnterWorkspace || !ideaSummary}
              onClick={() => workspaceHref && persistIdeaAndGo(workspaceHref)}
              className="h-11 border-[#A3E635]/35 bg-[#A3E635]/10 text-[#D9F99D] hover:bg-[#A3E635]/20"
            >
              <Rocket className="h-4 w-4" />
              Build with Mentor
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canEnterWorkspace}
              onClick={() => workspaceHref && router.push(workspaceHref)}
              className="h-11 border-white/[0.12] bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
            >
              Move to Workspace
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function readMentorIdeaSeed(): {
  idea: string;
  messages: ChatLine[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MENTOR_SEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { idea?: string; messages?: ChatLine[] };
    if (!parsed.idea) return null;
    return { idea: parsed.idea, messages: parsed.messages ?? [] };
  } catch {
    return null;
  }
}

export function clearMentorIdeaSeed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MENTOR_SEED_KEY);
}
