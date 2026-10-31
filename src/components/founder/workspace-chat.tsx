"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

import type { WorkspaceChatMessage } from "@/lib/database.types";

type WorkspaceChatProps = {
  messages: WorkspaceChatMessage[];
  viewerInitials: string;
  isMentorThinking: boolean;
  reduceMotion: boolean | null;
  emptyState: React.ReactNode;
};

const GPU = { transform: "translateZ(0)" };

export function WorkspaceChat({
  messages,
  viewerInitials,
  isMentorThinking,
  reduceMotion,
  emptyState,
}: WorkspaceChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 120;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current && messages.length > 1) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isMentorThinking]);

  const hasMessages = messages.length > 0;

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth px-4 py-4 md:px-8 md:py-6"
      aria-label="Mentor conversation"
    >
      {!hasMessages ? (
        <div className="flex min-h-full flex-1 items-center justify-center">{emptyState}</div>
      ) : (
        <motion.div
          className="relative z-10 mx-auto w-full max-w-3xl space-y-5 pb-4"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={GPU}
        >
          {messages.map((msg, i) => (
            <div
              key={`${i}-${msg.role}-${msg.content.slice(0, 24)}`}
              className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A3E635]/25 bg-zinc-900 text-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.15)]">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed md:text-sm ${
                  msg.role === "user"
                    ? "border border-[#A3E635]/20 bg-zinc-800 text-white shadow-md"
                    : "whitespace-pre-line border border-white/10 bg-zinc-900 text-zinc-200 shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A3E635]/30 bg-zinc-800 text-xs font-extrabold text-[#A3E635]">
                  {viewerInitials}
                </div>
              )}
            </div>
          ))}
          {isMentorThinking && (
            <div className="flex justify-start gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A3E635]/25 bg-zinc-900 text-[#A3E635]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-3.5 text-sm text-zinc-400">
                Mentor is thinking…
              </div>
            </div>
          )}
          <div ref={endRef} className="h-px shrink-0" aria-hidden />
        </motion.div>
      )}
    </div>
  );
}
