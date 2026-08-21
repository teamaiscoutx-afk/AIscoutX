"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is AIscoutX?",
    answer:
      "AIscoutX is your 24/7 AI Startup Co-Founder & Mentor platform. It validates your startup ideas using real-time market data, generates market blueprints, creates MVP execution roadmaps, and builds investor-ready pitch decks.",
  },
  {
    question: "How does AIscoutX validate startup ideas?",
    answer:
      "Our AI engine scans live web signals, competitor gaps, search demand, and social conversations to score your concept's market demand, competition density, and monetization potential in seconds.",
  },
  {
    question: "Do I need technical skills or pitch deck experience to use this?",
    answer:
      "Not at all. AIscoutX is specifically designed for non-technical founders, solopreneurs, and first-time builders. The platform guides you step-by-step and handles the complex research and pitch structuring for you.",
  },
  {
    question: "What do I get with the AI Co-Founder mentor?",
    answer:
      "You get 24/7 access to an interactive AI mentor that helps you refine your value proposition, prepare for investor questions, fine-tune your pricing strategy, and solve daily execution roadblocks.",
  },
  {
    question: "Is there a free trial or Freemium plan?",
    answer:
      "Yes! You can start on our Freemium plan for free to validate your idea, generate initial startup blueprints, and test the AI Mentor before upgrading to Pro.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.12]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-white sm:text-base">
                {faq.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300",
                  isOpen && "rotate-180 text-[#deff9a]"
                )}
                strokeWidth={1.5}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="border-t border-white/[0.06] px-5 pb-4 text-sm leading-relaxed text-zinc-500 sm:px-6 sm:pb-5">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}