"use client";

import { Lock, Sparkles } from "lucide-react";

import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { Button } from "@/components/ui/button";

type ProLockScreenProps = {
  title: string;
  description: string;
  bullets: string[];
  reason?: string;
};

/** Full-page lock for Pro-gated routes (e.g. Founder GPS). */
export function ProLockScreen({
  title,
  description,
  bullets,
  reason,
}: ProLockScreenProps) {
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#deff9a]/25 bg-[#deff9a]/10 shadow-[0_0_40px_rgba(222,255,154,0.15)]">
        <Lock className="h-6 w-6 text-[#deff9a]" strokeWidth={1.5} />
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#deff9a]/80">
        Pro feature
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>

      <ul className="mt-6 space-y-2 text-left">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-sm text-zinc-400"
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#deff9a]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => openUpgradeModal(reason)}
        className="btn-glow-lime mt-8 bg-[#deff9a] px-8 font-semibold text-[#030308] hover:bg-[#deff9a]/90"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Upgrade to Pro
      </Button>
      <p className="mt-3 text-xs text-zinc-600">
        $49/mo · cancel anytime · activates instantly
      </p>
    </div>
  );
}
