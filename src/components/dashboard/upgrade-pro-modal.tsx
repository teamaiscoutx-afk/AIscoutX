"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BILLING_PLANS,
  handleCheckout,
  type BillingPlanId,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type UpgradeProModalProps = {
  compact?: boolean;
};

export function UpgradeProModal({ compact }: UpgradeProModalProps) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-[#deff9a]/25 bg-gradient-to-r from-[#deff9a]/10 to-[#deff9a]/5 font-medium text-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.08)] transition-all duration-200 hover:border-[#deff9a]/40 hover:shadow-[0_0_28px_rgba(222,255,154,0.15)]",
            compact
              ? "h-9 px-3 text-xs"
              : "h-10 px-4 text-sm"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Upgrade to Pro</span>
          <span className="sm:hidden">Pro</span>
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden border-white/[0.12] bg-[#06060f]/95 p-0 sm:w-full">
        <div className="shrink-0 border-b border-white/[0.06] px-6 py-5 pr-12 sm:px-8">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              ✨ Upgrade to Pro
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Unlock the full AI Founder OS pipeline and scale your venture
              intelligence.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="scrollbar-thin max-h-[calc(90vh-7rem)] flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:gap-5 md:p-8"
          >
            {BILLING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 transition-all duration-300",
                  plan.popular
                    ? "border-transparent bg-white/[0.04] shadow-[0_0_40px_rgba(222,255,154,0.12)]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
                )}
              >
                {plan.popular && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl p-px"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(222,255,154,0.6), rgba(222,255,154,0.1), rgba(222,255,154,0.4))",
                    }}
                  >
                    <div className="h-full w-full rounded-2xl bg-[#06060f]" />
                  </div>
                )}

                <div className="relative z-10 flex flex-1 flex-col">
                  {plan.popular && (
                    <span className="mb-3 inline-flex w-fit rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {plan.description}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-white">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-zinc-400"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#deff9a]"
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
                      "mt-6 w-full",
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
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
