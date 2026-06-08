"use client";

import { TrendingUp } from "lucide-react";

import type { Opportunity } from "@/lib/dashboard/opportunities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OpportunitiesFeedProps = {
  opportunities: Opportunity[];
  activeId: string | null;
  activeKeyword: string | null;
  searchQuery?: string;
  onSelect: (opportunity: Opportunity) => void;
};

function MiniBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#deff9a]/80 to-[#deff9a]"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function OpportunitiesFeed({
  opportunities,
  activeId,
  activeKeyword,
  searchQuery = "",
  onSelect,
}: OpportunitiesFeedProps) {
  const hasSearch = searchQuery.trim().length > 0;
  return (
    <div
      id="opportunities"
      className="glass-panel overflow-hidden rounded-2xl border-white/[0.08]"
    >
      {(hasSearch || activeKeyword) && (
        <div className="border-b border-white/[0.06] bg-[#deff9a]/[0.04] px-4 py-2.5 sm:px-6">
          <p className="text-xs text-zinc-400">
            {hasSearch ? (
              <>
                Search results for{" "}
                <span className="font-medium text-[#deff9a]">
                  &ldquo;{searchQuery.trim()}&rdquo;
                </span>
              </>
            ) : (
              <>
                Showing matches for{" "}
                <span className="font-medium text-[#deff9a]">
                  &ldquo;{activeKeyword}&rdquo;
                </span>
              </>
            )}
            {" · "}
            {opportunities.length} result
            {opportunities.length === 1 ? "" : "s"}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 sm:px-6 sm:py-4">Opportunity</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Category</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Growth</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Demand</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Momentum</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-zinc-500"
                >
                  {hasSearch ? (
                    <div className="mx-auto max-w-sm space-y-2">
                      <p className="text-zinc-400">
                        No matching signals found.
                      </p>
                      <p className="text-xs text-zinc-600">
                        Try searching{" "}
                        <span className="font-medium text-zinc-500">
                          &lsquo;AI&rsquo;
                        </span>{" "}
                        or{" "}
                        <span className="font-medium text-zinc-500">
                          &lsquo;SaaS&rsquo;
                        </span>
                        .
                      </p>
                    </div>
                  ) : (
                    <>
                      No opportunities match this keyword. Try another chip or
                      clear the filter.
                    </>
                  )}
                </td>
              </tr>
            ) : (
              opportunities.map((row) => {
                const isActive = activeId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(row);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View details for ${row.name}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "cursor-pointer border-b border-white/[0.04] transition-all duration-200 last:border-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#deff9a]/40 focus-visible:ring-inset",
                      isActive
                        ? "bg-[#deff9a]/[0.08] shadow-[inset_3px_0_0_0_#deff9a] hover:bg-[#deff9a]/[0.1]"
                        : "hover:bg-white/[0.04] hover:shadow-[inset_3px_0_0_0_rgba(222,255,154,0.35)]"
                    )}
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white">
                          {row.name}
                        </span>
                        {row.hot && (
                          <Badge
                            variant="outline"
                            className="border-orange-500/30 bg-orange-500/10 text-[10px] text-orange-400"
                          >
                            Hot
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-500 sm:px-6">
                      {row.category}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className="inline-flex items-center gap-1 text-emerald-400/90">
                        <TrendingUp
                          className="h-3.5 w-3.5"
                          strokeWidth={1.5}
                        />
                        {row.growth}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className="font-semibold tabular-nums text-[#deff9a]">
                        {row.score}
                        <span className="text-xs font-normal text-zinc-500">
                          /100
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <MiniBar score={row.score} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
