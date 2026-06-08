"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { fetchDeepBlueprint } from "@/app/actions/blueprints";
import type { BlueprintSectionKey, DeepBlueprint } from "@/lib/founder/blueprint-generator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExpandableBlueprintCardProps = {
  workspaceId: string;
  sectionKey: BlueprintSectionKey;
  title: string;
  subtitle?: string;
  preview: string;
  index?: number;
  accent?: "lime" | "violet" | "amber" | "cyan";
  checklist?: string[];
};

const accentStyles = {
  lime: "border-[#deff9a]/20 hover:border-[#deff9a]/35 hover:shadow-[0_0_32px_rgba(222,255,154,0.12)]",
  violet: "border-violet-500/20 hover:border-violet-500/35 hover:shadow-[0_0_32px_rgba(139,92,246,0.12)]",
  amber: "border-amber-500/20 hover:border-amber-500/35 hover:shadow-[0_0_32px_rgba(245,158,11,0.1)]",
  cyan: "border-cyan-500/20 hover:border-cyan-500/35 hover:shadow-[0_0_32px_rgba(34,211,238,0.1)]",
};

export function ExpandableBlueprintCard({
  workspaceId,
  sectionKey,
  title,
  subtitle,
  preview,
  index,
  accent = "lime",
  checklist,
}: ExpandableBlueprintCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [blueprint, setBlueprint] = useState<DeepBlueprint | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await fetchDeepBlueprint({
        workspaceId,
        sectionKey,
        sectionTitle: title,
        index,
      });
      if (result.ok && result.blueprint) {
        setBlueprint(result.blueprint);
        setExpanded(true);
      }
    });
  }

  const checklistDone = checklist
    ? Object.values(checked).filter(Boolean).length
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group glass-panel overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-xl transition-all duration-300",
        accentStyles[accent],
        expanded && "border-[#deff9a]/30 shadow-[0_0_40px_rgba(222,255,154,0.08)]"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-colors group-hover:border-[#deff9a]/30 group-hover:bg-[#deff9a]/10">
          <Target className="h-4 w-4 text-[#deff9a]/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            {checklist && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500">
                {checklistDone}/{checklist.length}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-600">
              {subtitle}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{preview}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300",
            expanded && "rotate-180 text-[#deff9a]"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-5">
              {checklist && (
                <ul className="mb-4 space-y-2">
                  {checklist.map((item, i) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() =>
                          setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
                        }
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all",
                          checked[i]
                            ? "border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a]"
                            : "border-white/[0.06] bg-black/20 text-zinc-400 hover:border-white/10"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            checked[i] ? "text-[#deff9a]" : "text-zinc-600"
                          )}
                        />
                        <span className={checked[i] ? "line-through opacity-80" : ""}>
                          {item}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {blueprint ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.06] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]/80">
                      Deep Blueprint
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {blueprint.title}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{blueprint.objective}</p>
                  </div>

                  <ol className="space-y-2">
                    {blueprint.steps.map((step) => (
                      <li
                        key={step.order}
                        className="rounded-xl border border-white/[0.08] bg-black/25 p-3 transition-colors hover:border-white/[0.12]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-[#deff9a]">
                            STEP {step.order}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {step.timeEstimate}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white">{step.action}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Deliverable: {step.deliverable}
                        </p>
                      </li>
                    ))}
                  </ol>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="text-[10px] font-semibold uppercase text-emerald-400/80">
                        Success metric
                      </p>
                      <p className="mt-1 text-xs text-zinc-300">
                        {blueprint.successMetric}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-400/80">
                        <AlertTriangle className="h-3 w-3" />
                        Pro tip
                      </p>
                      <p className="mt-1 text-xs text-zinc-300">{blueprint.proTip}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <p className="text-xs text-zinc-500">
                  Expand for quick checklist — generate a deep blueprint for granular
                  step-by-step execution.
                </p>
              )}

              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleGenerate}
                className="mt-4 border border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a] hover:bg-[#deff9a]/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Generating blueprint…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    🔍 Generate Deep Blueprint
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
