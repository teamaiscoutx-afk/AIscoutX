"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";

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
      "I'm your AI Mentor. Ask me to prioritize your next founder action, draft outreach, or pressure-test your MVP scope.",
  },
];

export function MentorChat() {
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES);
  const [input, setInput] = useState("");

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

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

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3E635]/80">
            AI Mentor
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Contextual founder helper</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
          Permanent mentor instance for execution guidance across your startup workspace.
        </p>
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
                    ? "border border-[#A3E635]/20 bg-[#A3E635]/10 text-[#D9F99D]"
                    : "border border-white/10 bg-zinc-900 text-zinc-300"
                }`}
              >
                {message.role === "assistant" && (
                  <Bot className="mb-2 h-4 w-4 text-[#A3E635]" />
                )}
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI mentor what to do next…"
              className="h-11 border-white/10 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[#A3E635]/40"
            />
            <Button type="submit" className="h-11 bg-[#A3E635] text-zinc-950 hover:bg-[#84CC16]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
