"use client";

import { Check } from "lucide-react";

import type { VenturePack } from "@/lib/mvp/types";

type BlueprintsViewProps = {
  pack: VenturePack | null;
};

export function BlueprintsView({ pack }: BlueprintsViewProps) {
  if (!pack) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-white">No blueprint yet</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Generate a venture pack from Discover to unlock tech stack, features, and roadmap.
        </p>
        <a href="/dashboard/discover" className="mt-4 inline-block text-sm text-[#deff9a] hover:underline">
          Generate blueprint →
        </a>
      </div>
    );
  }

  const { blueprint } = pack;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
        Module 3 · Blueprints
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Execution blueprint</h1>
      <p className="mt-1 text-sm text-zinc-500">Query: &ldquo;{pack.query}&rdquo;</p>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Name suggestions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {blueprint.nameSuggestions.map((name) => (
            <span
              key={name}
              className="rounded-full border border-[#deff9a]/20 bg-[#deff9a]/10 px-3 py-1 text-xs text-[#deff9a]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {(
          [
            ["Must-Have", blueprint.featureMatrix.mustHave],
            ["Nice-To-Have", blueprint.featureMatrix.niceToHave],
            ["Future", blueprint.featureMatrix.future],
          ] as const
        ).map(([label, items]) => (
          <div key={label} className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white">{label}</h2>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-zinc-400">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#deff9a]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Recommended tech stack</h2>
          <ul className="mt-4 space-y-3">
            {blueprint.techStack.map((row) => (
              <li key={row.layer} className="rounded-xl border border-white/[0.06] p-3">
                <p className="text-xs font-medium text-[#deff9a]">{row.layer}</p>
                <p className="text-sm text-white">{row.recommendation}</p>
                <p className="mt-1 text-xs text-zinc-500">{row.rationale}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Pricing structure</h2>
          <ul className="mt-4 space-y-3">
            {blueprint.pricingTiers.map((tier) => (
              <li key={tier.name} className="rounded-xl border border-white/[0.06] p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-white">{tier.name}</span>
                  <span className="text-sm text-[#deff9a]">{tier.price}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {tier.features.map((f) => (
                    <li key={f} className="text-xs text-zinc-500">
                      · {f}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">4-week milestone map</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {blueprint.roadmap.map((week) => (
            <div key={week.week} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
                Week {week.week}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{week.milestone}</p>
              <ul className="mt-2 space-y-1">
                {week.tasks.map((t) => (
                  <li key={t} className="text-xs text-zinc-500">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
