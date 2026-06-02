"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SCAN_DURATION_MS = 9000;

const BASE_STATUSES = [
  "🔍 Scouring current Reddit threads and Product Hunt signals...",
  null,
  "⚙️ Computing Proprietary Momentum & Competition matrix metrics...",
  "🚀 Curating bespoke actionable scripts, titles, and structural MVPs...",
] as const;

type IntelligenceScannerProps = {
  nicheLabel: string;
  onComplete: () => void;
};

export function IntelligenceScanner({
  nicheLabel,
  onComplete,
}: IntelligenceScannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tick, setTick] = useState(true);

  const statuses = useMemo(
    () =>
      BASE_STATUSES.map((line, index) =>
        index === 1
          ? `📊 Parsing metadata for high-performing ${nicheLabel} trends...`
          : line
      ),
    [nicheLabel]
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % statuses.length);
    }, SCAN_DURATION_MS / statuses.length);
    return () => window.clearInterval(interval);
  }, [statuses.length]);

  useEffect(() => {
    const blink = window.setInterval(() => setTick((t) => !t), 520);
    return () => window.clearInterval(blink);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(onComplete, SCAN_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[210] flex flex-col bg-[#020206]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(222,255,154,0.06),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(222,255,154,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(222,255,154,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center px-6 sm:px-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex items-center gap-3 border-b border-[#deff9a]/20 pb-4">
            <span
              className={`h-2.5 w-2.5 rounded-full bg-[#deff9a] shadow-[0_0_12px_#deff9a] transition-opacity duration-300 ${
                tick ? "opacity-100" : "opacity-30"
              }`}
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#deff9a]/90">
              Live intelligence scan
            </p>
            <span className="ml-auto font-mono text-[10px] text-zinc-600">
              AIScoutX v1
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/40 p-6 font-mono text-sm shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-8">
            <p className="text-zinc-600">
              <span className="text-[#deff9a]/70">$</span> aiscoutx scan
              --live --niche=&quot;{nicheLabel}&quot;
            </p>

            <div className="mt-6 min-h-[7rem] space-y-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="text-sm leading-relaxed text-zinc-300 sm:text-base"
                >
                  <span className="mr-2 text-[#deff9a]">&gt;</span>
                  {statuses[activeIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#deff9a]/40 via-[#deff9a] to-[#deff9a]/40"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: SCAN_DURATION_MS / 1000,
                  ease: "linear",
                }}
              />
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {statuses.map((status, index) => (
              <li
                key={status}
                className={`font-mono text-[11px] transition-colors duration-300 ${
                  index <= activeIndex ? "text-zinc-500" : "text-zinc-800"
                }`}
              >
                {index <= activeIndex ? "✓" : "·"} {status}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
