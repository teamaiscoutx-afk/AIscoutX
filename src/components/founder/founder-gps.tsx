"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Navigation,
  Sparkles,
  Trophy,
} from "lucide-react";

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

function useAnimatedNumber(value: number) {
  const spring = useSpring(value, { stiffness: 90, damping: 18, mass: 0.6 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [value, spring]);

  return display;
}

function ProgressGauge({
  label,
  value,
  celebrate,
}: {
  label: string;
  value: number;
  celebrate?: boolean;
}) {
  const animatedValue = useAnimatedNumber(value);
  const width = useSpring(0, { stiffness: 80, damping: 20 });

  useEffect(() => {
    width.set(value);
  }, [value, width]);

  const barWidth = useTransform(width, (v) => `${v}%`);

  return (
    <motion.div
      layout
      animate={
        celebrate
          ? { scale: [1, 1.03, 1], boxShadow: ["0 0 0 rgba(222,255,154,0)", "0 0 28px rgba(222,255,154,0.25)", "0 0 0 rgba(222,255,154,0)"] }
          : {}
      }
      transition={{ duration: 0.6 }}
      className="glass-panel group rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl transition-colors hover:border-[#deff9a]/20"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 transition-colors group-hover:text-zinc-300">
          {label}
        </span>
        <motion.span
          key={animatedValue}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-semibold tabular-nums text-[#deff9a]"
        >
          {animatedValue}%
        </motion.span>
      </div>
      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          style={{ width: barWidth }}
          className="relative h-full rounded-full bg-gradient-to-r from-[#deff9a]/40 via-[#deff9a] to-[#c8f080] shadow-[0_0_16px_rgba(222,255,154,0.45)]"
        >
          <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function FounderGps({
  workspace,
  tasks,
  onWorkspaceUpdated,
}: FounderGpsProps) {
  const [isPending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState(false);
  const [checklist, setChecklist] = useState<Record<number, boolean>>({});
  const prevScores = useRef({
    validation: workspace.validationScore,
    mvp: workspace.mvpScore,
    launch: workspace.launchScore,
    sales: workspace.salesScore,
  });

  const nextAction = deriveNextAction(workspace);
  const globalProgress = computeGlobalProgress(workspace);
  const animatedGlobal = useAnimatedNumber(globalProgress);
  const activeTask = tasks.find((t) => !t.isCompleted) ?? tasks[0] ?? null;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const scoreChanged =
    prevScores.current.validation !== workspace.validationScore ||
    prevScores.current.mvp !== workspace.mvpScore ||
    prevScores.current.launch !== workspace.launchScore ||
    prevScores.current.sales !== workspace.salesScore;

  useEffect(() => {
    if (scoreChanged) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 1200);
      prevScores.current = {
        validation: workspace.validationScore,
        mvp: workspace.mvpScore,
        launch: workspace.launchScore,
        sales: workspace.salesScore,
      };
      return () => clearTimeout(t);
    }
  }, [workspace, scoreChanged]);

  const subSteps = nextAction.templates ?? [];

  function handleComplete() {
    if (!activeTask) return;
    startTransition(async () => {
      const result = await completeNextAction(workspace.id, activeTask.id);
      if (result.ok && result.workspace) {
        setChecklist({});
        setJustCompleted(true);
        onWorkspaceUpdated?.(result.workspace, result.tasks);
      }
    });
  }

  const checklistDone = Object.values(checklist).filter(Boolean).length;
  const checklistReady =
    subSteps.length === 0 || checklistDone >= Math.min(2, subSteps.length);

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
            Global execution:{" "}
            <motion.span
              key={animatedGlobal}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="font-semibold text-[#deff9a]"
            >
              {animatedGlobal}%
            </motion.span>
          </p>
        </div>
        <motion.div
          animate={justCompleted ? { scale: [1, 1.05, 1] } : {}}
          className="flex items-center gap-2 rounded-full border border-[#deff9a]/25 bg-[#deff9a]/10 px-4 py-1.5 text-xs font-medium capitalize text-[#deff9a]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Stage: {workspace.currentStage}
        </motion.div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressGauge
          label="Idea Validation"
          value={workspace.validationScore}
          celebrate={justCompleted}
        />
        <ProgressGauge
          label="MVP Build"
          value={workspace.mvpScore}
          celebrate={justCompleted}
        />
        <ProgressGauge
          label="Launch Readiness"
          value={workspace.launchScore}
          celebrate={justCompleted}
        />
        <ProgressGauge
          label="Sales Velocity"
          value={workspace.salesScore}
          celebrate={justCompleted}
        />
      </div>

      <AnimatePresence>
        {justCompleted && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-[#deff9a]/30 bg-[#deff9a]/10 px-4 py-2 text-sm text-[#deff9a]"
          >
            <Trophy className="h-4 w-4" />
            Milestone advanced — keep the momentum going!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel relative overflow-hidden rounded-2xl border border-[#deff9a]/20 bg-gradient-to-br from-[#deff9a]/[0.08] via-transparent to-violet-500/[0.04] p-6 backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#deff9a]/10 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <motion.div
            animate={isPending ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 2, repeat: isPending ? Infinity : 0, ease: "linear" }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#deff9a]/30 bg-[#deff9a]/10"
          >
            <Navigation className="h-5 w-5 text-[#deff9a]" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]/80">
              Next Action
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {nextAction.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{nextAction.description}</p>

            <motion.div
              layout
              className="mt-4 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3"
            >
              <p className="text-sm text-zinc-200">
                {activeTask?.taskText ?? nextAction.taskText}
              </p>
              <p className="mt-2 text-[10px] text-zinc-600">
                {completedTasks} tasks completed · {tasks.length} total in queue
              </p>
            </motion.div>

            {subSteps.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Execution checklist ({checklistDone}/{subSteps.length})
                </p>
                {subSteps.map((item, i) => {
                  const done = checklist[i];
                  return (
                    <motion.button
                      key={item}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setChecklist((prev) => ({ ...prev, [i]: !prev[i] }))
                      }
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all duration-300",
                        done
                          ? "border-[#deff9a]/35 bg-[#deff9a]/10 text-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.08)]"
                          : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.04]"
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {done ? (
                          <motion.span
                            key="done"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#deff9a]" />
                          </motion.span>
                        ) : (
                          <motion.span key="open" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
                            <Circle className="mt-0.5 h-4 w-4 text-zinc-600" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <span className={done ? "line-through opacity-90" : ""}>
                        {item}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          disabled={!activeTask || isPending || !checklistReady}
          onClick={handleComplete}
          className={cn(
            "relative mt-5 w-full overflow-hidden bg-[#deff9a] font-semibold text-black transition-all hover:bg-[#d8f992] sm:w-auto",
            checklistReady && "btn-glow-lime shadow-[0_0_32px_rgba(222,255,154,0.35)]"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing progress…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete (+10%)
            </>
          )}
        </Button>
        {subSteps.length > 0 && !checklistReady && (
          <p className="mt-2 text-[11px] text-zinc-600">
            Complete at least 2 checklist items to unlock milestone sync.
          </p>
        )}
      </div>
    </section>
  );
}
