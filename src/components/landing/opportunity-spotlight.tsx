"use client";

import { ArrowUpRight, Target } from "lucide-react";

import { GlowHoverCard } from "@/components/landing/motion";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { label: "Score", value: "91/100" },
  { label: "Competition", value: "Low" },
  { label: "Growth", value: "+287%" },
  { label: "Revenue Potential", value: "High" },
];

export function OpportunitySpotlight() {
  return (
    <GlowHoverCard className="mx-auto w-full max-w-4xl">
      <div className="glass-panel relative overflow-hidden rounded-2xl border-[#deff9a]/20 shadow-[0_16px_64px_rgba(0,0,0,0.5),0_0_0_1px_rgba(222,255,154,0.1)] transition-all duration-300 hover:border-[#deff9a]/40 hover:shadow-[0_20px_80px_rgba(222,255,154,0.15)] sm:rounded-3xl">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] bg-[#deff9a]/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
          <div className="flex items-center gap-2">
            <Target
              className="h-4 w-4 text-[#deff9a] transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.5}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#deff9a]">
              Example Discovered Opportunity
            </span>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-[#deff9a]/25 bg-[#deff9a]/10 text-[#deff9a]"
          >
            Spotlight
          </Badge>
        </div>

        <div className="p-5 sm:p-8">
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            AI Appointment Automation
          </h3>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:px-4 sm:py-4"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-white sm:text-base">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-[#deff9a]/15 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Recommended Action
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
              <ArrowUpRight
                className="mt-0.5 h-4 w-4 shrink-0 text-[#deff9a] transition-transform duration-300"
                strokeWidth={1.5}
              />
              Launch an AI setup service for local businesses.
            </p>
          </div>
        </div>
      </div>
    </GlowHoverCard>
  );
}
