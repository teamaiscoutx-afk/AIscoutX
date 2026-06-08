"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";

import { FounderGps } from "@/components/founder/founder-gps";
import type { DailyTask, FounderStage, StartupWorkspace } from "@/lib/founder/types";

type PhaseWorkspacePageProps = {
  stage: FounderStage;
  title: string;
  description: string;
  workspaces: StartupWorkspace[];
  tasksByWorkspace: Record<string, DailyTask[]>;
};

export function PhaseWorkspacePage({
  stage,
  title,
  description,
  workspaces,
  tasksByWorkspace,
}: PhaseWorkspacePageProps) {
  const stageWorkspaces = useMemo(
    () => workspaces.filter((w) => w.currentStage === stage),
    [workspaces, stage]
  );
  const [activeId, setActiveId] = useState(stageWorkspaces[0]?.id ?? workspaces[0]?.id ?? "");
  const activeWorkspace =
    workspaces.find((w) => w.id === activeId) ?? stageWorkspaces[0] ?? workspaces[0] ?? null;
  const activeTasks = activeWorkspace ? tasksByWorkspace[activeWorkspace.id] ?? [] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
        Founder phase
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">{description}</p>

      {workspaces.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <Rocket className="mx-auto h-8 w-8 text-[#deff9a]/60" />
          <p className="mt-4 text-sm text-zinc-400">
            No startup workspaces yet. Discover an opportunity and click{" "}
            <span className="text-[#deff9a]">Build This Startup</span>.
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
                  activeWorkspace?.id === workspace.id
                    ? "border-[#deff9a]/40 bg-[#deff9a]/10 text-[#deff9a]"
                    : "border-white/10 text-zinc-500 hover:text-white"
                }`}
              >
                {workspace.opportunityName}
              </button>
            ))}
          </div>

          {activeWorkspace && (
            <div className="mt-8 space-y-6">
              <FounderGps
                workspace={activeWorkspace}
                tasks={activeTasks}
                onWorkspaceUpdated={() => {
                  window.location.reload();
                }}
              />
              <Link
                href={`/dashboard/workspace/${activeWorkspace.id}`}
                className="inline-flex text-sm text-[#deff9a] hover:underline"
              >
                Open full startup workspace →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
