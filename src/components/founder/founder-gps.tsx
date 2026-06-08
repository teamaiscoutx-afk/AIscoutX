"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Navigation } from "lucide-react";

import { completeNextAction } from "@/app/actions/workspaces";
import type { DailyTask, StartupWorkspace } from "@/lib/founder/types";
import {
  computeGlobalProgress,
  deriveNextAction,
} from "@/lib/founder/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FounderGpsProps = {
  workspace: StartupWorkspace;
  tasks: DailyTask[];
  onWorkspaceUpdated?: (
    workspace: StartupWorkspace,
    tasks?: DailyTask[]
  ) => void;
};

function ProgressGauge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-semibold tabular-nums text-[#deff9a]">{value}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#deff9a]/50 to-[#deff9a]"
        />
      </div>
    </div>
  );
}

export function FounderGps({
  workspace,
  tasks,
  onWorkspaceUpdated,
}: FounderGpsProps) {
  const [isPending, startTransition] = useTransition();
  const nextAction = deriveNextAction(workspace);
  const globalProgress = computeGlobalProgress(workspace);
  const activeTask = tasks.find((t) => !t.isCompleted) ?? tasks[0] ?? null;

  function handleComplete() {
    if (!activeTask) return;
    startTransition(async () => {
      const result = await completeNextAction(workspace.id, activeTask.id);
      if (result.ok && result.workspace) {
        onWorkspaceUpdated?.(result.workspace, result.tasks);
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
            Founder GPS
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {workspace.opportunityName}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Global execution progress:{" "}
            <span className="font-medium text-white">{globalProgress}%</span>
          </p>
        </div>
        <div className="rounded-full border border-[#deff9a]/25 bg-[#deff9a]/10 px-4 py-1.5 text-xs font-medium capitalize text-[#deff9a]">
          Stage: {workspace.currentStage}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressGauge label="Idea Validation" value={workspace.validationScore} />
        <ProgressGauge label="MVP Build" value={workspace.mvpScore} />
        <ProgressGauge label="Launch Readiness" value={workspace.launchScore} />
        <ProgressGauge label="Sales Velocity" value={workspace.salesScore} />
      </div>

      <div className="rounded-2xl border border-[#deff9a]/20 bg-gradient-to-br from-[#deff9a]/[0.08] to-transparent p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#deff9a]/30 bg-[#deff9a]/10">
            <Navigation className="h-5 w-5 text-[#deff9a]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]/80">
              Next Action
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {nextAction.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{nextAction.description}</p>
            <p className="mt-3 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-zinc-200">
              {activeTask?.taskText ?? nextAction.taskText}
            </p>
            {nextAction.templates && nextAction.templates.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-zinc-500">
                {nextAction.templates.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#deff9a]">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button
          type="button"
          disabled={!activeTask || isPending}
          onClick={handleComplete}
          className={cn(
            "mt-5 w-full bg-[#deff9a] font-semibold text-black hover:bg-[#d8f992] sm:w-auto"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating progress…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
