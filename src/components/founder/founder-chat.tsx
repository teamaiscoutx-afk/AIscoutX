"use client";

import { useMemo, useState, useTransition } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

import { sendFounderChatMessage } from "@/app/actions/chat";
import {
  checkChatMessage,
  incrementChatMessage,
  type UsageSnapshot,
} from "@/app/actions/usage";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { UsageBadge } from "@/components/mvp/tier-gate";
import { CHAT_LIMIT_MESSAGE, FREE_TIER_LIMITS } from "@/lib/billing/tier-limits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const STARTER_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "I'm your AI Founder strategist. Ask me to prioritize your next action, draft outreach, or pressure-test your MVP scope.",
  },
];

type FounderChatProps = {
  usage: UsageSnapshot;
};

export function FounderChat({ usage }: FounderChatProps) {
  const { openUpgradeModal } = useUpgradeModal();
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentThisSession, setSentThisSession] = useState(0);
  const [isPending, startTransition] = useTransition();

  const freeMessagesUsed = usage.chatMessagesThisMonth + sentThisSession;
  const limitReached =
    !usage.isPaid && freeMessagesUsed >= FREE_TIER_LIMITS.chatMessagesPerMonth;

  const messagesWithSystemBlock = useMemo(() => {
    if (!limitReached) return messages;
    return [
      ...messages,
      {
        id: "free-limit",
        role: "system" as const,
        content: CHAT_LIMIT_MESSAGE,
      },
    ];
  }, [messages, limitReached]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || limitReached) return;

    startTransition(async () => {
      setError(null);
      const gate = await checkChatMessage();
      if (!gate.allowed) {
        // Server says limit hit — sync local counter so the system block renders
        setSentThisSession(
          Math.max(
            FREE_TIER_LIMITS.chatMessagesPerMonth - usage.chatMessagesThisMonth,
            0
          )
        );
        return;
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      const history = messages
        .filter(
          (m): m is Message & { role: "user" | "assistant" } =>
            m.role !== "system"
        )
        .map((m) => ({ role: m.role, content: m.content }));

      const chat = await sendFounderChatMessage(trimmed, history);
      if (!chat.ok || !chat.reply) {
        setError(chat.error ?? "Could not get a reply.");
        return;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: chat.reply,
      };

      await incrementChatMessage();
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setSentThisSession((n) => n + 1);
      setInput("");
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
            Module 6 · AI Founder Chat
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Strategy assistant
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {usage.isPaid
              ? "Unlimited interactive guidance on your startup blueprint and launch plan."
              : `${Math.max(FREE_TIER_LIMITS.chatMessagesPerMonth - freeMessagesUsed, 0)} free strategy messages left this month.`}
          </p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messagesWithSystemBlock.map((message) => {
            if (message.role === "system") {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="w-full max-w-md rounded-2xl border border-[#deff9a]/25 bg-[#deff9a]/[0.06] p-5 text-center">
                    <p className="text-sm font-medium text-white">
                      {message.content}
                    </p>
                    <Button
                      type="button"
                      onClick={() => openUpgradeModal(CHAT_LIMIT_MESSAGE)}
                      className="btn-glow-lime mt-4 bg-[#deff9a] px-6 font-semibold text-[#030308] hover:bg-[#deff9a]/90"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-[#deff9a]/15 text-[#deff9a]"
                      : "border border-white/[0.08] bg-black/30 text-zinc-300"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Bot className="mb-2 h-4 w-4 text-[#deff9a]" />
                  )}
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] p-4">
          {error && (
            <p className="mb-2 text-xs text-orange-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                limitReached
                  ? "Free limit reached — upgrade to keep going"
                  : "Ask your founder strategist…"
              }
              disabled={isPending || limitReached}
              className="border-white/[0.08] bg-white/[0.03]"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={isPending || limitReached || !input.trim()}
              className="bg-[#deff9a] text-[#030308] hover:bg-[#deff9a]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
