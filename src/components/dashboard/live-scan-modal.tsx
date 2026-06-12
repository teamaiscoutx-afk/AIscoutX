"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Radar } from "lucide-react";

const STATUS_LINES = [
  "Scanning Live Opportunities across Reddit, X, and Product Hunt…",
  "Finding demanding business ideas in real-time with Tavily web search…",
  "Computing demand, growth, and momentum scores from live signals…",
  "Structuring top SaaS opportunities with OpenAI intelligence…",
  "Saving verified opportunities to your Supabase intelligence DB…",
] as const;

type LiveScanModalProps = {
  open: boolean;
  nicheLabel: string;
  workspaceLabel?: string;
  progressHint?: string;
};

export function LiveScanModal({
  open,
  nicheLabel,
  workspaceLabel,
  progressHint,
}: LiveScanModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const headline = useMemo(() => {
    if (workspaceLabel) {
      return `${workspaceLabel} · ${nicheLabel}`;
    }
    return nicheLabel;
  }, [workspaceLabel, nicheLabel]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STATUS_LINES.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[240] flex items-center justify-center bg-[#020206]/90 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-scan-title"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(222,255,154,0.08),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a12]/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#deff9a]/25 bg-[#deff9a]/10">
            <Radar className="h-6 w-6 text-[#deff9a]" strokeWidth={1.5} />
            <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-[#deff9a]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#deff9a]/80">
              Live Web Intelligence
            </p>
            <h2 id="live-scan-title" className="mt-2 text-xl font-semibold text-white">
              Scanning Live Opportunities
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{headline}</p>
          </div>
        </div>

        <div className="mt-6 min-h-[4.5rem] rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-sm leading-relaxed text-zinc-300"
            >
              {STATUS_LINES[activeIndex]}
            </motion.p>
          </AnimatePresence>
          {progressHint && (
            <p className="mt-3 text-xs text-zinc-500">{progressHint}</p>
          )}
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#deff9a]/30 via-[#deff9a] to-[#deff9a]/30"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            style={{ width: "40%" }}
          />
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Real API data only — no placeholders. This may take up to a minute for 10 ideas.
        </p>
      </motion.div>
    </motion.div>
  );
}
