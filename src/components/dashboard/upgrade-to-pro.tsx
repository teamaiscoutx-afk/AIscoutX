"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BILLING_PLANS,
  handleCheckout,
  type BillingPlanId,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type UpgradeToProProps = {
  compact?: boolean;
};

export function UpgradeToPro({ compact }: UpgradeToProProps) {
  const [open, setOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanId | null>(null);

  async function onCheckout(planId: BillingPlanId) {
    setLoadingPlan(planId);
    try {
      await handleCheckout(planId);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-[#deff9a]/25 bg-gradient-to-r from-[#deff9a]/10 to-[#deff9a]/5 font-medium text-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.08)] transition-all duration-200 hover:border-[#deff9a]/40 hover:shadow-[0_0_28px_rgba(222,255,154,0.15)]",
            compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Upgrade to Pro</span>
          <span className="sm:hidden">Pro</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        {/* Full-screen overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm" />

        {/*
          Center via inset-0 + margin:auto — NO transform.
          Transform-based centering breaks when animate-in overrides translate.
        */}
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-[201] m-auto grid h-auto max-h-[90vh] w-[min(94vw,72rem)] grid-rows-[auto_1fr] overflow-hidden",
            "border border-white/[0.12] bg-[#06060f]/98 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl",
            "rounded-2xl outline-none focus:outline-none"
          )}
        >
          {/* Static header */}
          <div className="relative shrink-0 border-b border-white/[0.06] px-6 py-5 pr-14 sm:px-8">
            <DialogPrimitive.Title className="text-xl font-semibold text-white sm:text-2xl">
              ✨ Upgrade to Pro
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm text-zinc-400">
              Unlock the full AI Founder OS pipeline and scale your venture
              intelligence.
            </DialogPrimitive.Description>

            <DialogPrimitive.Close
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors hover:border-white/[0.14] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable pricing grid */}
          <div className="min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            <div className="grid grid-cols-1 items-stretch gap-6 p-6 pb-12 sm:grid-cols-3 sm:p-8 sm:pb-14">
              {BILLING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex min-w-0 flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5",
                    plan.popular
                      ? "shadow-[0_0_40px_rgba(222,255,154,0.12)]"
                      : "hover:border-white/[0.14] hover:bg-white/[0.04]"
                  )}
                >
                  {plan.popular && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl p-px"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(222,255,154,0.55), rgba(222,255,154,0.08), rgba(222,255,154,0.35))",
                      }}
                    >
                      <div className="h-full w-full rounded-2xl bg-[#06060f]/90 backdrop-blur-xl" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-1 flex-col">
                    {plan.popular && (
                      <span className="mb-2.5 inline-flex w-fit rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
                        Most Popular
                      </span>
                    )}

                    <h3 className="text-base font-semibold text-white sm:text-lg">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                      {plan.description}
                    </p>

                    <div className="mt-3 flex items-baseline gap-1 sm:mt-4">
                      <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
                        ${plan.price}
                      </span>
                      <span className="text-xs text-zinc-500 sm:text-sm">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="mt-4 flex-1 space-y-2 sm:mt-5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-[11px] leading-snug text-zinc-400"
                        >
                          <Check
                            className="mt-0.5 h-3 w-3 shrink-0 text-[#deff9a]"
                            strokeWidth={2}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      disabled={loadingPlan !== null}
                      onClick={() => onCheckout(plan.id)}
                      className={cn(
                        "mt-auto w-full pt-5 sm:pt-6",
                        plan.popular
                          ? "bg-[#deff9a] text-[#030308] hover:bg-[#deff9a]/90"
                          : "border border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                      )}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {loadingPlan === plan.id
                        ? "Redirecting…"
                        : plan.id === "pro"
                          ? "Get Started with Pro"
                          : `Choose ${plan.name}`}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
