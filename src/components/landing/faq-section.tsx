"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What is AIscoutX?",
    answer:
      "AIscoutX is an intelligence platform that monitors discussions across Reddit, X, YouTube, and more—then surfaces high-potential opportunities with scores, hooks, and actionable briefs before they go mainstream.",
  },
  {
    question: "How are opportunities discovered?",
    answer:
      "Our AI scans thousands of conversations 24/7, detects acceleration patterns, and ranks each signal by demand momentum, competition, and revenue potential—so you only see what’s worth your time.",
  },
  {
    question: "Can creators and founders use it?",
    answer:
      "Absolutely. Creators use AIscoutX for viral hooks and niche timing; founders use it for market validation, trend spotting, and launching products with a real edge.",
  },
  {
    question: "When is the official launch?",
    answer:
      "We’re onboarding early access members now. Join the waitlist to get priority access, founding-member pricing, and your first Weekly Opportunity Brief before public launch.",
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
