"use client";

import { TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { FadeIn } from "@/components/landing/motion";
import { Badge } from "@/components/ui/badge";

const opportunities = [
  {
    name: "AI Workflow Automation",
    category: "B2B SaaS",
    score: 87,
    growth: "+124%",
    barWidth: "87%",
    hot: true,
  },
  {
    name: "Micro-SaaS for Creators",
    category: "Creator Tools",
    score: 79,
    growth: "+89%",
    barWidth: "79%",
    hot: false,
  },
  {
    name: "Vertical AI Agents",
    category: "Infrastructure",
    score: 92,
    growth: "+201%",
    barWidth: "92%",
    hot: true,
  },
];

function MiniBar({ width }: { width: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#deff9a]/80 to-[#deff9a]"
        style={{ width }}
      />
    </div>
  );
}

export function DashboardPreview() {
  return (
    <FadeIn className="relative mx-auto w-full max-w-4xl">
      <motion.div
        initial={false}
        whileHover={{ y: -2, transition: { duration: 0.3 } }}
        className="relative"
      >
        <div className="absolute -left-2 top-8 z-20 hidden rounded-lg border border-[#deff9a]/20 bg-[#deff9a]/10 px-3 py-1.5 text-xs font-medium text-[#deff9a] shadow-lg backdrop-blur-md sm:block">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Live signals
          </span>
        </div>
        <div className="absolute -right-2 top-24 z-20 hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400 shadow-lg backdrop-blur-md sm:block">
          Updated 2m ago
        </div>

        <div className="glass-panel relative overflow-hidden rounded-2xl border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 hover:border-white/[0.15] sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
              </div>
              <span className="text-xs font-medium text-zinc-500 sm:text-sm">
                AIscoutX Dashboard Preview
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-[#deff9a]/30 bg-[#deff9a]/10 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a] sm:text-xs"
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#deff9a]" />
              Live
            </Badge>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-5 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
                  Intelligence feed
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                  Exploding Opportunities
                </h3>
              </div>
              <p className="text-xs text-zinc-600">Ranked by demand momentum</p>
            </div>

            <div className="space-y-3">
              {opportunities.map((item) => (
                <div
                  key={item.name}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-white sm:text-base">
                          {item.name}
                        </p>
                        {item.hot && (
                          <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                            Hot
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {item.category}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400/90">
                        <TrendingUp
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
                          strokeWidth={1.5}
                        />
                        <span className="font-medium tabular-nums">
                          {item.growth}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                          Demand Score
                        </p>
                        <p className="text-lg font-bold tabular-nums text-[#deff9a] sm:text-xl">
                          {item.score}
                          <span className="text-sm font-normal text-zinc-500">
                            /100
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <MiniBar width={item.barWidth} />
                    <span className="hidden text-[10px] text-zinc-600 sm:inline">
                      Momentum index
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-5 sm:gap-4">
              {[
                { label: "Signals today", value: "24" },
                { label: "Avg. score", value: "81" },
                { label: "New this week", value: "12" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-center transition-colors duration-300 hover:border-white/[0.1] sm:px-4 sm:py-3"
                >
                  <p className="text-lg font-semibold tabular-nums text-white sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-500 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#deff9a]/[0.03] to-transparent"
          />
        </div>
      </motion.div>
    </FadeIn>
  );
}
