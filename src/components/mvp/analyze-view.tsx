"use client";

import type { UsageSnapshot } from "@/app/actions/usage";
import type { VenturePack } from "@/lib/mvp/types";
import { UsageBadge } from "@/components/mvp/tier-gate";

type AnalyzeViewProps = {
  pack: VenturePack | null;
  usage: UsageSnapshot;
};

export function AnalyzeView({ pack, usage }: AnalyzeViewProps) {
  if (!pack) {
    return (
      <EmptyState
        title="No analysis yet"
        body="Go to Discover, enter what you're building, and generate your first venture pack."
        href="/dashboard/discover"
      />
    );
  }

  const { analyze } = pack;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
            Module 2 · Analyze
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Market &amp; competitor intelligence
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Query: &ldquo;{pack.query}&rdquo;</p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Problem statement</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {analyze.problemStatement}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(analyze.marketSizing).map(([key, value]) => (
          <div key={key} className="glass-panel rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {key}
            </p>
            <p className="mt-2 text-sm text-zinc-300">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Target personas</h2>
          <ul className="mt-4 space-y-4">
            {analyze.targetPersonas.map((persona) => (
              <li key={persona.name} className="border-b border-white/[0.04] pb-4 last:border-0">
                <p className="font-medium text-[#deff9a]">{persona.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{persona.pain}</p>
                <p className="mt-1 text-xs text-zinc-600">WTP: {persona.willingnessToPay}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Competitor gap grid</h2>
          <ul className="mt-4 space-y-4">
            {analyze.competitors.map((c) => (
              <li key={c.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="font-medium text-white">{c.name}</p>
                <p className="mt-1 text-xs text-zinc-500">Gap: {c.gap}</p>
                <p className="mt-1 text-xs text-[#deff9a]/80">→ {c.positioning}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
      <a href={href} className="mt-4 inline-block text-sm text-[#deff9a] hover:underline">
        Go to Discover →
      </a>
    </div>
  );
}
