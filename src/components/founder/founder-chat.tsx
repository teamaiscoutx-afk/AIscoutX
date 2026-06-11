"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, Send, Sparkles } from "lucide-react";

import type { UsageSnapshot } from "@/app/actions/usage";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { ChatMarkdown } from "@/components/founder/chat-markdown";
import { UsageBadge } from "@/components/mvp/tier-gate";
import { FREE_TIER_LIMITS } from "@/lib/billing/tier-limits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LIMIT_BANNER_COPY =
  "✨ Your free strategic credits are exhausted. Upgrade to Pro for unlimited mentor conversations.";

const WELCOME_COPY =
  "I'm your AI Strategy Co-Founder. I already know what you're building — ask me to prioritize your next move, pressure-test your MVP scope, or draft outreach that converts.";

type FounderChatProps = {
  usage: UsageSnapshot;
};

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 shadow-[0_0_24px_rgba(222,255,154,0.06)] backdrop-blur-xl">
        <Bot className="mr-1 h-4 w-4 text-[#deff9a]" />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#deff9a]/80"
            style={{ animationDelay: `${i * 180}ms`, animationDuration: "900ms" }}
          />
        ))}
      </div>
    </div>
  );
}

export function FounderChat({ usage }: FounderChatProps) {
  const { openUpgradeModal } = useUpgradeModal();
  const [input, setInput] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    onError: (err) => {
      const raw = err?.message ?? "";
      if (raw.includes("UPGRADE_REQUIRED")) {
        setLimitHit(true);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as { error?: string };
        setErrorText(parsed.error ?? "The mentor hit a snag. Try again.");
      } catch {
        setErrorText("The mentor hit a snag. Try again.");
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  const sentThisSession = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const freeMessagesUsed = usage.chatMessagesThisMonth + sentThisSession;
  const limitReached =
    !usage.isPaid &&
    (limitHit || freeMessagesUsed >= FREE_TIER_LIMITS.chatMessagesPerMonth);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status, limitReached]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || limitReached || isBusy) return;
    setErrorText(null);
    void sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
            Module 6 · AI Founder Chat
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Strategy Co-Founder
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {usage.isPaid
              ? "Unlimited mentor conversations, fully aware of your active project."
              : `${Math.max(FREE_TIER_LIMITS.chatMessagesPerMonth - freeMessagesUsed, 0)} free strategy messages left this month.`}
          </p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Static welcome bubble */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
              <Bot className="mb-2 h-4 w-4 text-[#deff9a]" />
              <p className="text-sm leading-relaxed text-zinc-300">
                {WELCOME_COPY}
              </p>
            </div>
          </div>

          {messages.map((message) => {
            const text = message.parts
              .filter(
                (part): part is { type: "text"; text: string } =>
                  part.type === "text"
              )
              .map((part) => part.text)
              .join("");

            if (!text) return null;

            if (message.role === "user") {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[#deff9a]/15 px-4 py-3 text-sm text-[#deff9a]">
                    {text}
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
                  <Bot className="mb-2 h-4 w-4 text-[#deff9a]" />
                  <ChatMarkdown content={text} />
                </div>
              </div>
            );
          })}

          {status === "submitted" && <TypingIndicator />}

          {limitReached && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => openUpgradeModal(LIMIT_BANNER_COPY)}
                className="w-full max-w-md rounded-2xl border border-[#deff9a]/25 bg-[#deff9a]/[0.06] p-5 text-center shadow-[0_0_32px_rgba(222,255,154,0.1)] backdrop-blur-xl transition-colors hover:bg-[#deff9a]/[0.1]"
              >
                <p className="text-sm font-medium text-white">
                  {LIMIT_BANNER_COPY}
                </p>
                <span className="btn-glow-lime mt-4 inline-flex items-center rounded-md bg-[#deff9a] px-6 py-2 text-sm font-semibold text-[#030308]">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </span>
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/[0.06] p-4">
          {errorText && (
            <p className="mb-2 text-xs text-orange-400" role="alert">
              {errorText}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                limitReached
                  ? "Free credits exhausted — upgrade to keep going"
                  : "Ask your strategy co-founder…"
              }
              disabled={limitReached}
              className="border-white/[0.08] bg-white/[0.03]"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={isBusy || limitReached || !input.trim()}
              className="bg-[#deff9a] text-[#030308] hover:bg-[#deff9a]/90 disabled:bg-zinc-700 disabled:text-zinc-500"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
