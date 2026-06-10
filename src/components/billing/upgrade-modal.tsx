"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Lock, Sparkles, X, Zap } from "lucide-react";

import { BILLING_PLANS, startProCheckout } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpgradeModalContextValue = {
  openUpgradeModal: (reason?: string) => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue>({
  openUpgradeModal: () => undefined,
});

export function useUpgradeModal(): UpgradeModalContextValue {
  return useContext(UpgradeModalContext);
}

export function UpgradeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const openUpgradeModal = useCallback((triggerReason?: string) => {
    setReason(triggerReason ?? null);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openUpgradeModal }), [openUpgradeModal]);

  function handleUpgrade() {
    setRedirecting(true);
    startProCheckout();
  }

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm" />

          <DialogPrimitive.Content
            className={cn(
              "fixed inset-0 z-[221] m-auto grid h-auto max-h-[92vh] w-[min(94vw,52rem)] grid-rows-[auto_1fr] overflow-hidden",
              "rounded-2xl border border-white/[0.12] bg-[#06060f]/98 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl outline-none"
            )}
          >
            <div className="relative shrink-0 border-b border-white/[0.06] px-6 py-5 pr-14 sm:px-8">
              <div className="flex items-center gap-2 text-[#deff9a]">
                <Lock className="h-4 w-4" strokeWidth={1.5} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                  Pro feature
                </p>
              </div>
              <DialogPrimitive.Title className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                This is where the real engine starts
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm text-zinc-400">
                {reason ??
                  "Blueprints, Deep Dive specs, and Founder GPS run on Pro. One plan, everything unlocked."}
              </DialogPrimitive.Description>

              <DialogPrimitive.Close
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors hover:border-white/[0.14] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 items-stretch gap-5 p-6 sm:grid-cols-2 sm:p-8">
                {BILLING_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex min-w-0 flex-col rounded-2xl border p-5",
                      plan.popular
                        ? "border-[#deff9a]/30 bg-[#deff9a]/[0.04] shadow-[0_0_40px_rgba(222,255,154,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02]"
                    )}
                  >
                    {plan.popular && (
                      <span className="mb-2.5 inline-flex w-fit items-center gap-1 rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
                        <Zap className="h-3 w-3" />
                        Everything unlocked
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs leading-snug text-zinc-500">
                      {plan.description}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tabular-nums text-white">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-xs leading-snug text-zinc-400"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              plan.popular ? "text-[#deff9a]" : "text-zinc-600"
                            )}
                            strokeWidth={2}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.id === "pro" ? (
                      <Button
                        type="button"
                        disabled={redirecting}
                        onClick={handleUpgrade}
                        className="btn-glow-lime mt-6 w-full bg-[#deff9a] font-semibold text-[#030308] hover:bg-[#deff9a]/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {redirecting ? "Opening checkout…" : "Upgrade to Pro"}
                      </Button>
                    ) : (
                      <div className="mt-6 w-full rounded-lg border border-white/[0.08] py-2.5 text-center text-xs text-zinc-500">
                        {plan.cta}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="px-6 pb-6 text-center text-[11px] text-zinc-600 sm:px-8">
                Cancel anytime. Access activates the second your payment clears
                — no waiting, no manual steps.
              </p>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </UpgradeModalContext.Provider>
  );
}
