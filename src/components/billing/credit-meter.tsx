"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";

import { TOPUP_CREDITS, TOPUP_PRICE_USD } from "@/lib/billing/credit-plans";
import { openRazorpayCheckout } from "@/lib/billing/razorpay";

type CreditSnapshot = {
  remaining: number;
  allowance: number;
  used: number;
  resetAt: string;
};

export function CreditMeter() {
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/credits", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const data = (await response.json()) as CreditSnapshot & { ok?: boolean };
      if (!data.ok) return;
      setSnapshot({
        remaining: data.remaining,
        allowance: data.allowance,
        used: data.used,
        resetAt: data.resetAt,
      });
    } catch {
      // Keep the last reading.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const remaining = snapshot?.remaining ?? 200;
  const allowance = snapshot?.allowance ?? 200;
  const used = snapshot?.used ?? 0;
  const resetLabel = snapshot
    ? new Date(snapshot.resetAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "the 1st";

  async function buyTopUp() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "topup" }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        orderId?: string;
        amount?: number;
        description?: string;
        prefill?: { email?: string; name?: string };
      };
      if (response.status === 401 || data.code === "AUTH_REQUIRED") {
        window.location.href = "/login?next=/dashboard";
        return;
      }
      if (!response.ok || !data.success || !data.orderId) {
        throw new Error(data.error ?? "Could not start the top-up.");
      }
      await openRazorpayCheckout({
        orderId: data.orderId,
        amount: data.amount,
        description: data.description,
        prefill: data.prefill,
        onSuccess: () => {
          setOpen(false);
          void load();
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#A3E635]/30 bg-zinc-950/70 px-3 py-1.5 text-[11px] font-bold text-[#D9F99D] shadow-[0_0_24px_rgba(163,230,53,0.12)] backdrop-blur-xl"
        style={{ willChange: "transform" }}
      >
        <Zap className="h-3.5 w-3.5 text-[#A3E635]" />
        {remaining} / {allowance} Credits
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-labelledby="credit-meter-title"
              className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p id="credit-meter-title" className="text-sm font-bold text-white">
                    Credit usage
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {remaining} of {allowance} monthly credits left
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-white"
                  aria-label="Close credit meter"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-zinc-300">
                  <dt>Monthly allowance</dt>
                  <dd className="font-semibold text-white">{allowance}</dd>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <dt>Used this cycle</dt>
                  <dd className="font-semibold text-white">{used}</dd>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <dt>Remaining</dt>
                  <dd className="font-semibold text-[#A3E635]">{remaining}</dd>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <dt>Next monthly reset</dt>
                  <dd className="font-semibold text-white">{resetLabel}</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-2xl border border-[#A3E635]/25 bg-[#A3E635]/10 p-4">
                <p className="text-sm font-bold text-white">
                  ${TOPUP_PRICE_USD} for {TOPUP_CREDITS} extra credits
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  A one-time top-up. Your monthly 200 still refresh on {resetLabel}.
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void buyTopUp()}
                  className="mt-4 h-10 w-full cursor-pointer rounded-xl bg-[#A3E635] text-sm font-bold text-zinc-950 hover:bg-[#84CC16]"
                >
                  {pending ? "Opening checkout…" : `$${TOPUP_PRICE_USD} for ${TOPUP_CREDITS} Extra Credits`}
                </button>
                {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
