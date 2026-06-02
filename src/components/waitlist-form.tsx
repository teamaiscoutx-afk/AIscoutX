"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type WaitlistStatus = "idle" | "loading" | "success" | "error";

const leadMagnetBenefits = [
  "Weekly Opportunity Brief",
  "Top 5 Exploding Niches",
  "Viral Content Hooks",
];

const formTransition = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

type WaitlistFormProps = {
  className?: string;
  showMicroTrust?: boolean;
};

export function WaitlistForm({
  className,
  showMicroTrust = true,
}: WaitlistFormProps) {
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string)?.trim();

    if (!email) {
      setStatus("error");
      setErrorMessage("Please enter your email address.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  const isSuccess = status === "success";

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            {...formTransition}
            className="glass-panel relative overflow-hidden rounded-2xl px-6 py-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5)] sm:px-10 sm:py-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(222,255,154,0.1)_0%,transparent_65%)]"
            />
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10"
              >
                <Sparkles className="h-5 w-5 text-[#deff9a]" />
              </motion.div>
              <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Welcome to AIscoutX! 🎉
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                You&apos;re now on the early access list. We&apos;ve locked in
                your lifetime discount and your first weekly opportunity brief
                is on the way.
              </p>

              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                  hidden: {},
                }}
                className="mt-6 space-y-2.5 text-left sm:mx-auto sm:max-w-xs"
              >
                {leadMagnetBenefits.map((benefit) => (
                  <motion.li
                    key={benefit}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    className="flex items-center gap-2.5 text-sm text-zinc-400"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#deff9a]/15">
                      <Check className="h-3 w-3 text-[#deff9a]" strokeWidth={2.5} />
                    </span>
                    {benefit}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" {...formTransition}>
            <div className="glass-panel rounded-2xl p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] sm:p-2">
              <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  disabled={status === "loading"}
                  autoComplete="email"
                  className="glass-input h-12 flex-1 rounded-xl border-white/[0.12] px-4 text-base text-white shadow-inner placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 sm:h-[52px]"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={status === "loading"}
                  className="btn-glow-lime btn-shimmer relative h-12 shrink-0 overflow-hidden rounded-xl bg-[#deff9a] px-6 text-sm font-semibold tracking-tight text-black hover:bg-[#d8f992] disabled:opacity-80 sm:h-[52px] sm:px-8"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin transition-transform" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Join Early Access
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {showMicroTrust && (
              <p className="mt-3 text-center text-[11px] text-zinc-600 sm:text-xs">
                No credit card required. Founding members get lifetime discounts.
              </p>
            )}

            <AnimatePresence>
              {status === "error" && errorMessage && (
                <motion.p
                  key="error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 text-center text-xs text-red-400/90"
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
