"use client";

import { Lock } from "lucide-react";

import type { UsageSnapshot } from "@/app/actions/usage";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { isUnlimitedLimit } from "@/lib/billing/usage-serialize";
import { cn } from "@/lib/utils";

type TierGateProps = {
  usage: UsageSnapshot;
  children: React.ReactNode;
  feature?: string;
  className?: string;
};

/** Blur overlay for legacy Pro-only sections — prefer usage-aware gates in server actions. */
export function TierGate({ usage, children, feature, className }: TierGateProps) {
  const { openUpgradeModal } = useUpgradeModal();

  if (usage.isPaid) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#030308]/80 p-6 text-center backdrop-blur-md">
        <Lock className="h-8 w-8 text-[#deff9a]/70" />
        <p className="mt-3 text-sm font-medium text-white">
          {feature ?? "Pro feature"}
        </p>
        <button
          type="button"
          onClick={() => openUpgradeModal()}
          className="mt-4 text-xs font-medium text-[#deff9a] hover:underline"
        >
          Upgrade to Pro →
        </button>
      </div>
    </div>
  );
}

export function UsageBadge({ usage }: { usage: UsageSnapshot }) {
  if (usage.isPaid) {
    return (
      <span className="rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
        Pro · Unlimited
      </span>
    );
  }

  const blueprintsRemaining = isUnlimitedLimit(usage.blueprintsLimit)
    ? "∞"
    : Math.max(usage.blueprintsLimit - usage.blueprintsThisMonth, 0);

  return (
    <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-zinc-500">
      Free · {blueprintsRemaining} blueprint{blueprintsRemaining === 1 ? "" : "s"}{" "}
      left · {usage.chatMessagesThisMonth}/{usage.chatMessagesLimit} chats
    </span>
  );
}
