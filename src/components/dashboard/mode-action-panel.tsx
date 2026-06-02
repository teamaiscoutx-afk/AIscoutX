"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { WorkspaceMode } from "@/lib/dashboard/workspace";

type ModeActionPanelProps = {
  opportunity: Opportunity;
  mode: WorkspaceMode;
};

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

function nonEmpty(values: string[]): string[] {
  return values.map((v) => v.trim()).filter(Boolean);
}

export function ModeActionPanel({ opportunity, mode }: ModeActionPanelProps) {
  const { intelligence } = opportunity;
  const videoTitles = nonEmpty(intelligence.creator.videoTitles);
  const hooks = nonEmpty(intelligence.creator.hooks);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${opportunity.id}-${mode}`}
        {...panelMotion}
        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
      >
        {mode === "founder" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#deff9a]">
              Startup opportunity
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-zinc-300">Problem</dt>
                <dd className="mt-0.5 leading-relaxed text-zinc-500">
                  {intelligence.founder.problem}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-300">Solution</dt>
                <dd className="mt-0.5 leading-relaxed text-zinc-500">
                  {intelligence.founder.solution}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-300">
                  Minimal viable product (MVP)
                </dt>
                <dd className="mt-0.5 leading-relaxed text-zinc-500">
                  {intelligence.founder.mvp}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-300">
                  Estimated launch time
                </dt>
                <dd className="mt-0.5 font-semibold text-[#deff9a]">
                  {intelligence.founder.launchTime}
                </dd>
              </div>
            </dl>
          </>
        )}

        {mode === "creator" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#deff9a]">
              Content strategy
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="font-medium text-zinc-300">Viral video title ideas</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-zinc-500">
                  {videoTitles.length > 0 ? (
                    videoTitles.map((title) => (
                      <li key={title} className="leading-relaxed">
                        {title}
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-600">
                      Add creator titles in mode_data intelligence.
                    </li>
                  )}
                </ol>
              </div>
              <div>
                <p className="font-medium text-zinc-300">High-converting hooks</p>
                <ul className="mt-2 space-y-1.5 text-zinc-500">
                  {hooks.length > 0 ? (
                    hooks.map((hook) => (
                      <li
                        key={hook}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs leading-relaxed italic"
                      >
                        &ldquo;{hook}&rdquo;
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-600">No hooks in database record.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="font-medium text-zinc-300">Target platform</p>
                <p className="mt-1 text-[#deff9a]">{intelligence.creator.platform}</p>
              </div>
            </div>
          </>
        )}

        {mode === "agency" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#deff9a]">
              High-ticket service
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-zinc-300">Core service offer</dt>
                <dd className="mt-0.5 leading-relaxed text-zinc-500">
                  {intelligence.agency.serviceOffer}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-300">
                  Ideal client profiles (ICP)
                </dt>
                <dd className="mt-0.5 leading-relaxed text-zinc-500">
                  {intelligence.agency.icp}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-300">
                  Recommended monthly retainer
                </dt>
                <dd className="mt-0.5 font-semibold text-[#deff9a]">
                  {intelligence.agency.retainer}
                </dd>
              </div>
            </dl>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
