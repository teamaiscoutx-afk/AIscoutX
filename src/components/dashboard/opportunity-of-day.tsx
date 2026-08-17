"use client";

import { ArrowRight } from "lucide-react";

import type { Opportunity } from "@/lib/dashboard/opportunities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OpportunityOfDayProps = {
  opportunity: Opportunity;
  onActNow: () => void;
};

export function OpportunityOfDay({
  opportunity,
  onActNow,
}: OpportunityOfDayProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#deff9a]/25 bg-gradient-to-br from-[#deff9a]/[0.08] via-white/[0.02] to-transparent p-5 shadow-[0_0_48px_rgba(222,255,154,0.08)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#deff9a]/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#deff9a]">
            🔥 Opportunity of the Day
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {opportunity.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.04] text-zinc-300"
            >
              Score {opportunity.score}/100
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            >
              {opportunity.competitionLabel} competition
            </Badge>
            <span className="text-xs text-emerald-400/90">
              {opportunity.growth} growth
            </span>
          </div>
        </div>
        <Button
          onClick={onActNow}
          className="btn-glow-lime shrink-0 bg-[#deff9a] font-semibold text-black hover:bg-[#d8f992]"
        >
          Act Now
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
