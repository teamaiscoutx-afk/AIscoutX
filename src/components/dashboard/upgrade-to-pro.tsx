"use client";

import { Sparkles } from "lucide-react";

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
