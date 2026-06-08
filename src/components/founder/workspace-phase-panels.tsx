"use client";

import { motion } from "framer-motion";

import { ExpandableBlueprintCard } from "@/components/founder/expandable-blueprint-card";
import type { WorkspaceSummary } from "@/lib/founder/types";

type WorkspacePhasePanelsProps = {
  workspaceId: string;
  summary: WorkspaceSummary;
  activeTab: string;
};

const panelMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export function WorkspacePhasePanels({
  workspaceId,
  summary,
  activeTab,
}: WorkspacePhasePanelsProps) {
  return (
    <motion.div key={activeTab} {...panelMotion} className="space-y-4">
      {activeTab === "overview" && (
        <>
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="overview-problem"
            title="Core Problem"
            subtitle="Validation lens"
            preview={summary.overview.problem}
            accent="violet"
            checklist={[
              "Document 3 user pain quotes",
              "Score pain severity 1-10",
              "Publish problem statement for feedback",
            ]}
          />
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="overview-solution"
            title="Solution Mechanism"
            subtitle="Product lens"
            preview={summary.overview.solution}
            accent="lime"
            checklist={[
              "Define 10-minute wow moment",
              "Record concierge demo",
              "Collect 5 objections",
            ]}
          />
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="overview-target"
            title="Target Customer"
            subtitle="ICP lens"
            preview={summary.overview.targetCustomer}
            accent="cyan"
            checklist={[
              "Write ICP one-pager",
              "Build list of 20 accounts",
              "Send 10 personalized outreaches",
            ]}
          />
        </>
      )}

      {activeTab === "validation" && (
        <>
          {summary.validation.hypotheses.map((h, i) => (
            <ExpandableBlueprintCard
              key={h}
              workspaceId={workspaceId}
              sectionKey="validation-hypothesis"
              title={`Hypothesis ${i + 1}`}
              subtitle="Test & learn"
              preview={h}
              index={i}
              accent="lime"
              checklist={[
                "Write falsifiable version",
                "Run smallest experiment",
                "Record pass/fail decision",
              ]}
            />
          ))}
          {summary.validation.interviewQuestions.slice(0, 3).map((q, i) => (
            <ExpandableBlueprintCard
              key={q}
              workspaceId={workspaceId}
              sectionKey="validation-interview"
              title={`Interview script ${i + 1}`}
              subtitle="Customer discovery"
              preview={q}
              index={i}
              accent="violet"
            />
          ))}
          {summary.validation.proofSignals.map((s, i) => (
            <ExpandableBlueprintCard
              key={s}
              workspaceId={workspaceId}
              sectionKey="validation-signal"
              title={`Market signal: ${s}`}
              subtitle="Proof layer"
              preview={`Validate demand via ${s}`}
              index={i}
              accent="amber"
            />
          ))}
        </>
      )}

      {activeTab === "competitors" && (
        <>
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="competitor-gap"
            title="Market Gap Wedge"
            subtitle="Positioning"
            preview={summary.competitors.marketGap}
            accent="lime"
            checklist={[
              "Map 5 alternatives",
              "Score on niche-fit",
              "Define your wedge",
            ]}
          />
          {summary.competitors.players.map((player, i) => (
            <ExpandableBlueprintCard
              key={player.name}
              workspaceId={workspaceId}
              sectionKey="competitor-player"
              title={player.name}
              subtitle={player.positioning}
              preview={player.gap}
              index={i}
              accent="violet"
              checklist={[
                "Snapshot pricing & promise",
                "Mine negative reviews",
                "Draft counter-positioning",
              ]}
            />
          ))}
        </>
      )}

      {activeTab === "mvp" && (
        <>
          {summary.mvp.mustHave.map((f, i) => (
            <ExpandableBlueprintCard
              key={f}
              workspaceId={workspaceId}
              sectionKey="mvp-must-have"
              title={`Must build: ${f}`}
              subtitle="MVP core"
              preview={f}
              index={i}
              accent="lime"
            />
          ))}
          {summary.mvp.mustNot.map((f, i) => (
            <ExpandableBlueprintCard
              key={f}
              workspaceId={workspaceId}
              sectionKey="mvp-must-not"
              title={`Defer: ${f}`}
              subtitle="Scope guard"
              preview={`Intentionally excluded from v1: ${f}`}
              index={i}
              accent="amber"
            />
          ))}
          {summary.mvp.roadmap.map((phase, i) => (
            <ExpandableBlueprintCard
              key={phase.phase}
              workspaceId={workspaceId}
              sectionKey="mvp-phase"
              title={phase.phase}
              subtitle="Roadmap sprint"
              preview={phase.features.join(" · ")}
              index={i}
              accent="cyan"
              checklist={phase.features.map((feat) => `Ship: ${feat}`)}
            />
          ))}
        </>
      )}

      {activeTab === "launch" && (
        <>
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="launch-messaging"
            title="Launch Narrative"
            subtitle="GTM copy"
            preview={summary.launch.messaging}
            accent="lime"
          />
          {summary.launch.channels.map((ch, i) => (
            <ExpandableBlueprintCard
              key={ch}
              workspaceId={workspaceId}
              sectionKey="launch-channel"
              title={`Channel: ${ch}`}
              subtitle="Distribution"
              preview={`First-week playbook for ${ch}`}
              index={i}
              accent="violet"
            />
          ))}
          {summary.launch.first30Days.map((day, i) => (
            <ExpandableBlueprintCard
              key={day}
              workspaceId={workspaceId}
              sectionKey="launch-day"
              title={`Day ${i + 1} action`}
              subtitle="30-day sprint"
              preview={day}
              index={i}
              accent="cyan"
            />
          ))}
        </>
      )}

      {activeTab === "revenue" && (
        <>
          <ExpandableBlueprintCard
            workspaceId={workspaceId}
            sectionKey="revenue-model"
            title="Pricing Model"
            subtitle="Monetization"
            preview={summary.revenue.pricingModel}
            accent="lime"
            checklist={[
              "Model 3 price scenarios",
              "Validate in 5 calls",
              "Publish pricing page",
            ]}
          />
          {summary.revenue.tiers.map((tier, i) => (
            <ExpandableBlueprintCard
              key={tier.name}
              workspaceId={workspaceId}
              sectionKey="revenue-tier"
              title={`${tier.name} — ${tier.price}`}
              subtitle="Tier playbook"
              preview={tier.features.join(" · ")}
              index={i}
              accent={i === 1 ? "violet" : "cyan"}
              checklist={tier.features.map((f) => `Include: ${f}`)}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}
