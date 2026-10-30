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
import { Check, CheckCircle2, Sparkles, X, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { FreemiumPlanPicker } from "@/components/billing/freemium-plan-picker";
import { PRO_MODAL_FEATURES, PRO_PRICE_DISPLAY } from "@/lib/billing/constants";
import { useRazorpayCheckout } from "@/lib/billing/use-razorpay-checkout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpgradeModalContextValue = {
  openUpgradeModal: (reason?: string) => void;
  openFreemiumPaywall: () => void;
  showSuccessModal: () => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue>({
  openUpgradeModal: () => undefined,
  openFreemiumPaywall: () => undefined,
  showSuccessModal: () => undefined,
});

const ease = [0.22, 1, 0.36, 1] as const;

export function useUpgradeModal(): UpgradeModalContextValue {
  return useContext(UpgradeModalContext);
}

function ModalAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        className="absolute left-1/2 top-0 h-[280px] w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.22)_0%,transparent_68%)] blur-3xl"
        animate={
          reduceMotion ? undefined : { opacity: [0.35, 0.65, 0.35], scale: [0.95, 1.05, 0.95] }
        }
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(163,230,53,0.1),transparent_55%)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#A3E635]/30 to-transparent" />
    </div>
  );
}

export function UpgradeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [freemiumMode, setFreemiumMode] = useState(false);
  const [paywallBlocking, setPaywallBlocking] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const { startCheckout, loading: redirecting, error: checkoutError, clearError } =
    useRazorpayCheckout();

  const openUpgradeModal = useCallback(
    (triggerReason?: string) => {
      clearError();
      setIsSuccess(false);
      setFreemiumMode(true);
      setPaywallBlocking(false);
      setReason(
        triggerReason ??
          "Compare plans side-by-side — more monthly credits, live market radar, and deeper mentor sessions."
      );
      setOpen(true);
    },
    [clearError]
  );

  const openFreemiumPaywall = useCallback(() => {
    clearError();
    setIsSuccess(false);
    setFreemiumMode(true);
    setPaywallBlocking(true);
    setReason(
      "You have used all 20 welcome credits. Pick a plan to keep building with live AI mentor + market radar."
    );
    setOpen(true);
  }, [clearError]);

  const showSuccessModal = useCallback(() => {
    setIsSuccess(true);
    setFreemiumMode(false);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openUpgradeModal, openFreemiumPaywall, showSuccessModal }),
    [openUpgradeModal, openFreemiumPaywall, showSuccessModal]
  );

  useEffect(() => {
    function onLegacyCheckout() {
      void startCheckout();
    }

    function onPaymentSuccess() {
      setIsSuccess(true);
      setOpen(true);
    }

    window.addEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
    window.addEventListener("aiscoutx:payment-success", onPaymentSuccess);

    return () => {
      window.removeEventListener("aiscoutx:start-pro-checkout", onLegacyCheckout);
      window.removeEventListener("aiscoutx:payment-success", onPaymentSuccess);
    };
  }, [startCheckout]);

  function handleProceedToPayment() {
    void startCheckout();
  }

  function handleStartBuilding() {
    setOpen(false);
    setIsSuccess(false);
    window.location.reload();
  }

  const contentMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.94, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
        transition: { duration: 0.45, ease },
      };

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[220] bg-black/88 backdrop-blur-md"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content
                forceMount
                className={cn(
                  "fixed inset-0 z-[221] m-auto h-auto max-h-[92vh] overflow-y-auto outline-none",
                  freemiumMode && !isSuccess
                    ? "w-[min(96vw,72rem)]"
                    : "w-[min(94vw,28rem)]",
                  "rounded-2xl border border-white/[0.1] bg-[#050508]/98",
                  "shadow-[0_0_100px_rgba(163,230,53,0.14),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300"
                )}
                onInteractOutside={(event) => {
                  if (freemiumMode && paywallBlocking) event.preventDefault();
                }}
                onEscapeKeyDown={(event) => {
                  if (freemiumMode && paywallBlocking) event.preventDefault();
                }}
              >
                <motion.div className="relative" {...contentMotion}>
                  {isSuccess ? (
                    <div className="relative p-6 text-center sm:p-8">
                      <DialogPrimitive.Close
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors hover:border-[#A3E635]/30 hover:text-white"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </DialogPrimitive.Close>

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#A3E635]/10 text-[#A3E635] ring-8 ring-[#A3E635]/10">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>

                      <DialogPrimitive.Title className="mt-5 text-2xl font-bold tracking-tight text-white">
                        Thank you!
                      </DialogPrimitive.Title>

                      <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
                        Your plan is active. Credits refresh on schedule — mentor chat, market radar, and blueprints are unlocked.
                      </DialogPrimitive.Description>

                      <Button
                        type="button"
                        onClick={handleStartBuilding}
                        className="btn-glow-lime mt-8 w-full bg-[#A3E635] font-semibold text-zinc-950 hover:bg-[#A3E635]/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Building
                      </Button>
                    </div>
                  ) : freemiumMode ? (
                    <>
                      <ModalAmbient />
                      <div className="relative border-b border-white/[0.06] px-5 py-6 sm:px-8 sm:py-7">
                        <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
                          <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A3E635]/30 bg-[#A3E635]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9F99D]">
                              <Zap className="h-3 w-3" />
                              Credit plans
                            </span>
                            <DialogPrimitive.Title className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                              {paywallBlocking ? "Welcome credits used" : "Upgrade your credits"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
                              {reason}
                            </DialogPrimitive.Description>
                          </div>
                          {!paywallBlocking && (
                            <DialogPrimitive.Close
                              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-all hover:scale-105 hover:border-[#A3E635]/35 hover:text-white"
                              aria-label="Close"
                            >
                              <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                          )}
                        </div>
                      </div>
                      <div className="relative px-5 py-6 sm:px-8 sm:pb-8">
                        <FreemiumPlanPicker />
                        <p className="mt-6 text-center text-[11px] text-zinc-500">
                          Secured by Razorpay · USD billing · Mentor & market radar resume right after checkout
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative border-b border-white/[0.06] px-6 py-6 pr-14 sm:px-8">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(163,230,53,0.08),transparent_70%)]"
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
                        <div className="rounded-xl border border-[#A3E635]/25 bg-[#A3E635]/[0.06] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A3E635]/80">
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
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#A3E635]"
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
                          className="btn-glow-lime mt-8 w-full bg-[#A3E635] font-semibold text-zinc-950 hover:bg-[#A3E635]/90"
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
                    </>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </UpgradeModalContext.Provider>
  );
}
