"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function PricingPageHero() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative z-10 mx-auto max-w-2xl text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3E635] drop-shadow-[0_0_12px_rgba(163,230,53,0.35)]">
        Pricing
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
        Credits that{" "}
        <span className="bg-gradient-to-r from-[#D9F99D] to-[#A3E635] bg-clip-text text-transparent">
          refresh every month
        </span>
      </h1>
      <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
        Every plan includes 200 credits per month. Longer plans bank the full run of credits up front
        and refresh the monthly allowance automatically.
      </p>
    </motion.div>
  );
}
