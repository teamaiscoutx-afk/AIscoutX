"use client";

import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Rocket, Sparkles, Zap } from "lucide-react";

import { PRO_PRICE_DISPLAY } from "@/lib/billing/constants";
import { BILLING_PLANS } from "@/lib/billing/plans";
import { useRazorpayCheckout } from "@/lib/billing/use-razorpay-checkout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlanSelectorModalProps = {
  open: boolean;
  onSelectFree: () => void;
};

/**
 * Post-onboarding plan selector — "Unlock Pro" opens Razorpay checkout (₹799 INR).
 */
export function PlanSelectorModal({ open, onSelectFree }: PlanSelectorModalProps) {
  const { startCheckout, loading: redirecting, error: checkoutError, clearError } =
    useRazorpayCheckout();

  useEffect(() => {
    function onLegacyCheckout() {
      void startCheckout();
    }
    window.addEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
    return () =>
      window.removeEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
  }, [startCheckout]);

  function handleUnlockPro() {
    clearError();
    void startCheckout();
  }

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[230] bg-black/85 backdrop-blur-md" />

        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-0 z-[231] m-auto grid h-auto max-h-[92vh] w-[min(94vw,54rem)] grid-rows-[auto_1fr] overflow-hidden",
            "rounded-2xl border border-white/[0.12] bg-[#06060f]/98 shadow-[0_0_100px_rgba(0,255,102,0.08)] backdrop-blur-xl outline-none"
          )}
        >
          <div className="relative shrink-0 border-b border-white/[0.06] px-6 py-6 text-center sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(0,255,102,0.08),transparent_70%)]"
            />
            <p className="relative text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00FF66]/80">
              One last step
            </p>
            <DialogPrimitive.Title className="relative mt-2 text-2xl font-semibold text-white">
              Pick how you want to build
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="relative mt-2 text-sm text-zinc-400">
              Your workspace is ready. Choose a plan to enter the dashboard.
            </DialogPrimitive.Description>
          </div>

          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-1 items-stretch gap-5 p-6 sm:grid-cols-2 sm:p-8">
              {BILLING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex min-w-0 flex-col rounded-2xl border p-5",
                    plan.popular
                      ? "border-[#00FF66]/35 bg-[#00FF66]/[0.05] shadow-[0_0_48px_rgba(0,255,102,0.14)]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  )}
                >
                  {plan.popular && (
                    <span className="mb-2.5 inline-flex w-fit items-center gap-1 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00FF66]">
                      <Zap className="h-3 w-3" />
                      Best value
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs leading-snug text-zinc-500">
                    {plan.description}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-white">
                      {plan.priceLabel}
                    </span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
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
                            plan.popular ? "text-[#00FF66]" : "text-zinc-600"
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
                      onClick={handleUnlockPro}
                      className="btn-glow-lime mt-6 w-full bg-[#00FF66] font-semibold text-[#030308] hover:bg-[#00FF66]/90"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {redirecting ? "Opening checkout…" : `Proceed to Payment (${PRO_PRICE_DISPLAY})`}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={redirecting}
                      onClick={onSelectFree}
                      className="mt-6 w-full border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      Start for Free
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="px-6 pb-6 text-center text-[11px] text-zinc-600 sm:px-8">
              {checkoutError ? (
                <span className="text-amber-400/90">{checkoutError}</span>
              ) : (
                <>Pro activates instantly after payment via Razorpay ({PRO_PRICE_DISPLAY}).</>
              )}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
