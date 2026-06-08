"use client";

import { motion } from "framer-motion";
import { Building2, Rocket, Sparkles, Target, User } from "lucide-react";

import {
  getNichesForIdentity,
  GOAL_OPTIONS,
  IDENTITY_OPTIONS,
  NICHE_FOCUS_OPTIONS,
  type CoreGoal,
  type NicheFocus,
  type NicheId,
  type WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import { cn } from "@/lib/utils";

const IDENTITY_ICONS: Record<WorkspaceIdentity, typeof Rocket> = {
  founder: Rocket,
  creator: Sparkles,
  agency: Building2,
  solopreneur: User,
};

type OnboardingModalProps = {
  identity: WorkspaceIdentity | null;
  goal: CoreGoal | null;
  nicheFocus: NicheFocus | null;
  niche: NicheId | null;
  onIdentityChange: (identity: WorkspaceIdentity) => void;
  onGoalChange: (goal: CoreGoal) => void;
  onNicheFocusChange: (focus: NicheFocus) => void;
  onNicheChange: (niche: NicheId, label: string) => void;
  onInitialize: () => void;
};

export function OnboardingModal({
  identity,
  goal,
  nicheFocus,
  niche,
  onIdentityChange,
  onGoalChange,
  onNicheFocusChange,
  onNicheChange,
  onInitialize,
}: OnboardingModalProps) {
  const nicheOptions = identity ? getNichesForIdentity(identity) : [];
  const canInitialize = Boolean(identity && goal && nicheFocus && niche);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.28 } }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-[#030308]/75 backdrop-blur-xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(222,255,154,0.12),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0a12]/90 shadow-[0_0_80px_rgba(222,255,154,0.08)] backdrop-blur-2xl"
      >
        <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#deff9a]/80">
            Founder setup
          </p>
          <h2
            id="onboarding-title"
            className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            Calibrate your AI founder team
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Tell us who you are and what you&apos;re building — we&apos;ll tailor
            your execution workspace.
          </p>
        </div>

        <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              1 · Persona / Role
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {IDENTITY_OPTIONS.map((option) => {
                const Icon = IDENTITY_ICONS[option.id];
                const selected = identity === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onIdentityChange(option.id)}
                    className={cn(
                      "group relative rounded-xl border p-4 text-left transition-all duration-300",
                      selected
                        ? "border-[#deff9a]/50 bg-[#deff9a]/[0.07] shadow-[0_0_32px_rgba(222,255,154,0.15)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        selected ? "text-[#deff9a]" : "text-zinc-500"
                      )}
                    />
                    <p className="mt-3 text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(!identity && "pointer-events-none opacity-40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              2 · Core goal
            </p>
            <div className="mt-4 space-y-2">
              {GOAL_OPTIONS.map((option) => {
                const selected = goal === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!identity}
                    onClick={() => onGoalChange(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      selected
                        ? "border-[#deff9a]/40 bg-[#deff9a]/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                    )}
                  >
                    <Target className={cn("h-4 w-4", selected ? "text-[#deff9a]" : "text-zinc-500")} />
                    <div>
                      <p className="text-sm font-medium text-white">{option.label}</p>
                      <p className="text-[11px] text-zinc-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(!goal && "pointer-events-none opacity-40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              3 · Niche focus
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {NICHE_FOCUS_OPTIONS.map((option) => {
                const selected = nicheFocus === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!goal}
                    onClick={() => onNicheFocusChange(option.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-medium transition-all",
                      selected
                        ? "border-[#deff9a]/45 bg-[#deff9a]/15 text-[#deff9a]"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(!nicheFocus && "pointer-events-none opacity-40")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              4 · Execution lane
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {nicheOptions.map((option) => {
                const selected = niche === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!nicheFocus}
                    onClick={() => onNicheChange(option.id, option.label)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-medium transition-all",
                      selected
                        ? "border-[#deff9a]/45 bg-[#deff9a]/15 text-[#deff9a]"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            disabled={!canInitialize}
            onClick={onInitialize}
            className={cn(
              "w-full rounded-xl py-3.5 text-sm font-semibold transition-all",
              canInitialize
                ? "bg-[#deff9a] text-[#030308] shadow-[0_0_40px_rgba(222,255,154,0.45)]"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            )}
          >
            Start Building →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
