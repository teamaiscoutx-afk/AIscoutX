"use client";

import { useState, useTransition } from "react";
import { Bot, Send } from "lucide-react";

import {
  checkChatMessage,
  incrementChatMessage,
  type UsageSnapshot,
} from "@/app/actions/usage";
import { UsageBadge } from "@/components/mvp/tier-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  role: "user" | "assistant";
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
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    startTransition(async () => {
      setError(null);
      const gate = await checkChatMessage();
      if (!gate.allowed) {
        setError(gate.reason ?? "Chat limit reached");
        return;
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "Focus on one measurable outcome today. If you're pre-revenue, run 5 customer interviews before adding features. If you're post-launch, follow up every warm lead within 24 hours.",
      };

      await incrementChatMessage();
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
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
            Unlimited interactive guidance on your startup blueprint and launch plan.
          </p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => (
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
          ))}
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
              placeholder="Ask your founder strategist…"
              disabled={isPending}
              className="border-white/[0.08] bg-white/[0.03]"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={isPending || !input.trim()}
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
