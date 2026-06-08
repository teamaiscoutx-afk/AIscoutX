"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FounderGps } from "@/components/founder/founder-gps";
import type { DailyTask, StartupWorkspace } from "@/lib/founder/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "validation", label: "Validation" },
  { id: "competitors", label: "Competitors" },
  { id: "mvp", label: "MVP Spec" },
  { id: "launch", label: "Launch Plan" },
  { id: "revenue", label: "Revenue Engine" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: DailyTask[];
};

export function StartupWorkspaceView({
  initialWorkspace,
  initialTasks,
}: StartupWorkspaceViewProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const summary = workspace.summary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/discover"
        className="inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#deff9a]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Discover
      </Link>

      <div className="mt-6">
        <FounderGps
          workspace={workspace}
          tasks={tasks}
          onWorkspaceUpdated={(updated, nextTasks) => {
            setWorkspace(updated);
            if (nextTasks) setTasks(nextTasks);
          }}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#deff9a]/15 text-[#deff9a]"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{summary.overview.tagline}</h3>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Problem:</span> {summary.overview.problem}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Solution:</span> {summary.overview.solution}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Target customer:</span>{" "}
              {summary.overview.targetCustomer}
            </p>
          </div>
        )}

        {activeTab === "validation" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Validation hypotheses</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {summary.validation.hypotheses.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
            <h4 className="pt-2 text-sm font-medium text-white">Interview questions</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              {summary.validation.interviewQuestions.map((q) => (
                <li key={q}>→ {q}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "competitors" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">{summary.competitors.marketGap}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.competitors.players.map((player) => (
                <div
                  key={player.name}
                  className="rounded-xl border border-white/[0.08] bg-black/20 p-4"
                >
                  <p className="font-medium text-white">{player.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{player.positioning}</p>
                  <p className="mt-2 text-sm text-zinc-400">Gap: {player.gap}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mvp" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[#deff9a]">Must build</h4>
              <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                {summary.mvp.mustHave.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-300/80">Must NOT build (yet)</h4>
              <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                {summary.mvp.mustNot.map((f) => (
                  <li key={f}>✕ {f}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              {summary.mvp.roadmap.map((phase) => (
                <div key={phase.phase} className="rounded-xl border border-white/[0.06] p-4">
                  <p className="text-sm font-medium text-white">{phase.phase}</p>
                  <p className="mt-1 text-xs text-zinc-500">{phase.features.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "launch" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">{summary.launch.messaging}</p>
            <p className="text-xs text-zinc-500">
              Channels: {summary.launch.channels.join(", ")}
            </p>
            <h4 className="text-sm font-medium text-white">First 30 days</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              {summary.launch.first30Days.map((step) => (
                <li key={step}>→ {step}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "revenue" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">{summary.revenue.pricingModel}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {summary.revenue.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-xl border border-white/[0.08] bg-black/20 p-4"
                >
                  <p className="font-semibold text-white">{tier.name}</p>
                  <p className="mt-1 text-[#deff9a]">{tier.price}</p>
                  <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                    {tier.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
