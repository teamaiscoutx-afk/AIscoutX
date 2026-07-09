"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Sparkles, X } from "lucide-react";

import { PRO_MODAL_FEATURES, PRO_PRICE_DISPLAY } from "@/lib/billing/constants";
import { useRazorpayCheckout } from "@/lib/billing/use-razorpay-checkout";
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
  const { startCheckout, loading: redirecting, error: checkoutError, clearError } =
    useRazorpayCheckout();

  const openUpgradeModal = useCallback(
    (triggerReason?: string) => {
      clearError();
      setReason(triggerReason ?? null);
      setOpen(true);
    },
    [clearError]
  );

  const value = useMemo(() => ({ openUpgradeModal }), [openUpgradeModal]);

  useEffect(() => {
    function onLegacyCheckout() {
      void startCheckout();
    }
    window.addEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
    return () =>
      window.removeEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
  }, [startCheckout]);

  function handleProceedToPayment() {
    void startCheckout();
  }

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-sm" />

          <DialogPrimitive.Content
            className={cn(
              "fixed inset-0 z-[221] m-auto h-auto w-[min(94vw,28rem)] overflow-hidden",
              "rounded-2xl border border-white/[0.12] bg-[#06060f]/98",
              "shadow-[0_0_80px_rgba(0,255,102,0.12)] backdrop-blur-xl outline-none"
            )}
          >
            <div className="relative border-b border-white/[0.06] px-6 py-6 pr-14 sm:px-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(0,255,102,0.08),transparent_70%)]"
              />
              <DialogPrimitive.Title className="relative text-xl font-semibold text-white sm:text-2xl">
                Unlock AIscoutX Pro Plan
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="relative mt-2 text-sm text-zinc-400">
                {reason ??
                  "Upgrade to unlock the full AI Founder OS — workspaces, GPS, and mentor chat."}
              </DialogPrimitive.Description>

              <DialogPrimitive.Close
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors hover:border-white/[0.14] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="rounded-xl border border-[#00FF66]/25 bg-[#00FF66]/[0.06] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00FF66]/80">
                  Active price
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-white">
                  {PRO_PRICE_DISPLAY}
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {PRO_MODAL_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-snug text-zinc-300"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#00FF66]"
                      strokeWidth={2}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                disabled={redirecting}
                onClick={handleProceedToPayment}
                className="btn-glow-lime mt-8 w-full bg-[#00FF66] font-semibold text-[#030308] hover:bg-[#00FF66]/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {redirecting ? "Opening checkout…" : "Proceed to Payment"}
              </Button>

              <p className="mt-4 text-center text-[11px] text-zinc-600">
                {checkoutError ? (
                  <span className="text-amber-400/90">{checkoutError}</span>
                ) : (
                  <>Secured by Razorpay • Global USD billing • Cancel anytime</>
                )}
              </p>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </UpgradeModalContext.Provider>
  );
}
