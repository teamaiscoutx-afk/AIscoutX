"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navigation } from "lucide-react";

import { FounderGps } from "@/components/founder/founder-gps";
import type { DailyTask, StartupWorkspace } from "@/lib/founder/types";

type FounderGpsPageProps = {
  workspaces: StartupWorkspace[];
  tasksByWorkspace: Record<string, DailyTask[]>;
};

export function FounderGpsPage({
  workspaces,
  tasksByWorkspace,
}: FounderGpsPageProps) {
  const [activeId, setActiveId] = useState(workspaces[0]?.id ?? "");
  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null,
    [workspaces, activeId]
  );
  const activeTasks = activeWorkspace
    ? tasksByWorkspace[activeWorkspace.id] ?? []
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
        Module 5 · Founder GPS
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Execution tracker</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        Validation, MVP, Launch, and Revenue scores with daily next actions.
      </p>

      {workspaces.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <Navigation className="mx-auto h-8 w-8 text-[#deff9a]/60" />
          <p className="mt-4 text-sm text-zinc-400">
            No active ventures yet. Generate a blueprint from Discover to start GPS
            tracking.
          </p>
          <Link
            href="/dashboard/discover"
            className="mt-4 inline-block text-sm text-[#deff9a] hover:underline"
          >
            Go to Discover →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveId(workspace.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  workspace.id === activeId
                    ? "border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a]"
                    : "border-white/[0.08] text-zinc-500 hover:text-white"
                }`}
              >
                {workspace.opportunityName}
              </button>
            ))}
          </div>

          {activeWorkspace && (
            <div className="mt-8">
              <FounderGps workspace={activeWorkspace} tasks={activeTasks} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
