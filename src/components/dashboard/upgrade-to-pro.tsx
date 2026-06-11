"use client";

import { Crown, Sparkles } from "lucide-react";

import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { cn } from "@/lib/utils";

type UpgradeToProProps = {
  compact?: boolean;
};

/** Topbar trigger — opens the global two-tier upgrade modal. */
export function UpgradeToPro({ compact }: UpgradeToProProps) {
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <button
      type="button"
      onClick={() => openUpgradeModal()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-[#deff9a]/25 bg-gradient-to-r from-[#deff9a]/10 to-[#deff9a]/5 font-medium text-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.08)] transition-all duration-200 hover:border-[#deff9a]/40 hover:shadow-[0_0_28px_rgba(222,255,154,0.15)]",
        compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"
      )}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="hidden sm:inline">Upgrade to Pro</span>
      <span className="sm:hidden">Pro</span>
    </button>
  );
}

/** Full-width premium CTA — sidebar footer / promo placements. */
export function UpgradeToProCta({ className }: { className?: string }) {
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <button
      type="button"
      onClick={() => openUpgradeModal()}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl p-px text-left transition-transform duration-200 active:scale-[0.98]",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#deff9a]/70 via-[#deff9a]/20 to-[#deff9a]/50 opacity-80 transition-opacity duration-200 group-hover:opacity-100"
      />
      <span className="relative flex items-center gap-3 rounded-[11px] bg-[#0a0a12] px-4 py-3 transition-colors duration-200 group-hover:bg-[#0d0d16]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#deff9a]/15 shadow-[0_0_18px_rgba(222,255,154,0.25)]">
          <Crown className="h-5 w-5 text-[#deff9a]" strokeWidth={1.5} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-white">
            Upgrade to Pro
          </span>
          <span className="block truncate text-[11px] text-zinc-500">
            Blueprints · Deep Dives · GPS — $19/mo
          </span>
        </span>
        <Sparkles
          className="ml-auto h-4 w-4 shrink-0 text-[#deff9a] transition-transform duration-200 group-hover:scale-110"
          strokeWidth={1.5}
        />
      </span>
    </button>
  );
}
