"use client";

import { ExternalLink } from "lucide-react";

import { DeepDiveGridSkeleton } from "@/components/dashboard/intelligence-skeleton";
import type { Opportunity } from "@/lib/dashboard/opportunities";

type OpportunityDeepDiveProps = {
  opportunity: Opportunity;
  loading?: boolean;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-[#deff9a]/80">
      {children}
    </p>
  );
}

export function OpportunityDeepDivePanel({
  opportunity,
  loading,
}: OpportunityDeepDiveProps) {
  if (loading) return <DeepDiveGridSkeleton />;

  const deepDive = opportunity.deepDive;
  if (!deepDive) {
    return (
      <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-zinc-500">
        Deep-dive intelligence loads when you open this signal.
      </div>
    );
  }

  const { marketGaps, solutionBlueprint, mvpAnatomy } = deepDive;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <SectionTitle>Real market gaps</SectionTitle>
        <div className="mt-3 space-y-3">
          {marketGaps.map((gap) => (
            <div
              key={`${gap.competitor}-${gap.url}`}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white">{gap.competitor}</p>
                <span className="shrink-0 text-[10px] uppercase text-zinc-500">
                  {gap.source}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {gap.complaint}
              </p>
              {gap.url && (
                <a
                  href={gap.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#deff9a] hover:underline"
                >
                  View source <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <SectionTitle>Professional solution blueprint</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {solutionBlueprint.overview}
        </p>
        <p className="mt-4 text-xs font-medium text-zinc-500">Business model</p>
        <p className="mt-1 text-sm text-zinc-400">{solutionBlueprint.businessModel}</p>

        <p className="mt-4 text-xs font-medium text-zinc-500">Go-to-market</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {solutionBlueprint.goToMarket.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-4 text-xs font-medium text-zinc-500">Technical architecture</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {solutionBlueprint.technicalArchitecture.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-4 text-xs font-medium text-zinc-500">Risks to watch</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-orange-300/80">
          {solutionBlueprint.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <SectionTitle>Practical MVP anatomy</SectionTitle>

        <p className="mt-4 text-xs font-medium text-zinc-500">Core functional flow</p>
        <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-zinc-300">
          {mvpAnatomy.coreFlow.map((step) => (
            <li key={step} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>

        <p className="mt-5 text-xs font-medium text-zinc-500">Tech stack</p>
        <div className="mt-2 space-y-2">
          {mvpAnatomy.techStack.map((row) => (
            <div
              key={`${row.layer}-${row.tool}`}
              className="rounded-lg border border-white/[0.06] p-3"
            >
              <p className="text-xs font-medium text-[#deff9a]">{row.layer}</p>
              <p className="text-sm text-white">{row.tool}</p>
              <p className="mt-1 text-xs text-zinc-500">{row.rationale}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-zinc-500">Must-have</p>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
              {mvpAnatomy.mustHave.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#deff9a]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Nice-to-have</p>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-500">
              {mvpAnatomy.niceToHave.map((item) => (
                <li key={item} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
