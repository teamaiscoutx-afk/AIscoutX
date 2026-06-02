"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ModeActionPanel } from "@/components/dashboard/mode-action-panel";
import { getWorkspaceDrawerInsights } from "@/lib/dashboard/drawer-insights";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";

type OpportunityDrawerDetailProps = {
  opportunity: Opportunity;
  activeWorkspace: WorkspaceIdentity;
};

const sectionMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

function InsightBlock({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string;
  delay?: number;
}) {
  return (
    <motion.section {...sectionMotion} transition={{ delay }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{value}</p>
    </motion.section>
  );
}

function InsightList({
  label,
  items,
  ordered = false,
  delay = 0,
}: {
  label: string;
  items: string[];
  ordered?: boolean;
  delay?: number;
}) {
  const ListTag = ordered ? "ol" : "ul";
  const listClass = ordered
    ? "mt-2 list-decimal space-y-2 pl-4 text-sm text-zinc-400"
    : "mt-2 space-y-2 text-sm text-zinc-400";

  return (
    <motion.section {...sectionMotion} transition={{ delay }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <ListTag className={listClass}>
        {items.map((item) => (
          <li
            key={item}
            className={
              ordered
                ? "leading-relaxed"
                : "rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs leading-relaxed italic"
            }
          >
            {ordered ? item : <> &ldquo;{item}&rdquo;</>}
          </li>
        ))}
      </ListTag>
    </motion.section>
  );
}

export function OpportunityDrawerDetail({
  opportunity,
  activeWorkspace,
}: OpportunityDrawerDetailProps) {
  const insights = useMemo(
    () => getWorkspaceDrawerInsights(opportunity, activeWorkspace),
    [opportunity, activeWorkspace]
  );

  const workspaceLabel =
    activeWorkspace.charAt(0).toUpperCase() + activeWorkspace.slice(1);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${opportunity.id}-${activeWorkspace}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        <InsightBlock label="Why it matters" value={insights.whyItMatters} />
        <InsightBlock
          label="Best for"
          value={insights.bestFor}
          delay={0.04}
        />
        <InsightBlock
          label="Recommended action"
          value={insights.recommendedAction}
          delay={0.08}
        />

        {insights.meta && (
          <InsightBlock
            label={insights.meta.label}
            value={insights.meta.value}
            delay={0.1}
          />
        )}

        {insights.primaryList && insights.primaryList.items.length > 0 && (
          <InsightList
            label={insights.primaryList.label}
            items={insights.primaryList.items}
            ordered={activeWorkspace === "founder"}
            delay={0.12}
          />
        )}

        {insights.secondaryList && insights.secondaryList.items.length > 0 && (
          <InsightList
            label={insights.secondaryList.label}
            items={insights.secondaryList.items}
            ordered={false}
            delay={0.14}
          />
        )}

        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            So what? —{" "}
            <span className="text-zinc-400">{workspaceLabel} lens</span>
          </p>
          <ModeActionPanel
            opportunity={opportunity}
            mode={insights.lens}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
