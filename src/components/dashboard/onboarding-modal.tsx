"use client";

import { motion } from "framer-motion";
import { Building2, Rocket, Sparkles, User } from "lucide-react";

import {
  getNichesForIdentity,
  IDENTITY_OPTIONS,
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
  niche: NicheId | null;
  onIdentityChange: (identity: WorkspaceIdentity) => void;
  onNicheChange: (niche: NicheId, label: string) => void;
  onInitialize: () => void;
};

export function OnboardingModal({
  identity,
  niche,
  onIdentityChange,
  onNicheChange,
  onInitialize,
}: OnboardingModalProps) {
  const nicheOptions = identity ? getNichesForIdentity(identity) : [];
  const canInitialize = Boolean(identity && niche);

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
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a12]/90 shadow-[0_0_80px_rgba(222,255,154,0.08)] backdrop-blur-2xl"
      >
        <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#deff9a]/80">
            Workspace setup
          </p>
          <h2
            id="onboarding-title"
            className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            Calibrate your intelligence feed
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Two quick choices — we tailor opportunities, keywords, and viral
            hooks to your lane.
          </p>
        </div>

        <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              1 · Select workspace identity
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
                      "group relative cursor-pointer rounded-xl border p-4 text-left transition-all duration-300",
                      selected
                        ? "border-[#deff9a]/50 bg-[#deff9a]/[0.07] shadow-[0_0_32px_rgba(222,255,154,0.15)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#deff9a] shadow-[0_0_8px_#deff9a]" />
                    )}
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        selected ? "text-[#deff9a]" : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className={cn(
              "transition-all duration-300",
              identity ? "opacity-100" : "pointer-events-none opacity-40"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              2 · Choose your niche focus
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {nicheOptions.map((option) => {
                const selected = niche === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!identity}
                    onClick={() => onNicheChange(option.id, option.label)}
                    className={cn(
                      "cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200",
                      selected
                        ? "border-[#deff9a]/45 bg-[#deff9a]/15 text-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.12)]"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-[#deff9a]/25 hover:text-white disabled:cursor-not-allowed"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {!identity && (
              <p className="mt-3 text-[11px] text-zinc-600">
                Select an identity to unlock niche options.
              </p>
            )}
          </section>

          <button
            type="button"
            disabled={!canInitialize}
            onClick={onInitialize}
            className={cn(
              "relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold transition-all duration-300",
              canInitialize
                ? "cursor-pointer bg-[#deff9a] text-[#030308] shadow-[0_0_40px_rgba(222,255,154,0.45)] hover:shadow-[0_0_56px_rgba(222,255,154,0.55)]"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            )}
          >
            {canInitialize && (
              <span className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            )}
            <span className="relative">Initialize Intelligence Feed →</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
