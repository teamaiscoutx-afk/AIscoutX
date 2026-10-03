"use client";

import { motion } from "framer-motion";
import { Radio, X } from "lucide-react";

import type { StartupRadarUpdate } from "@/lib/founder/startup-radar";

const GPU = { willChange: "transform, opacity" } as const;

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const card = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

type StartupRadarPanelProps = {
  startupName: string;
  niche: string | null;
  updates: StartupRadarUpdate[];
  loadingLive: boolean;
  reduceMotion: boolean | null;
  onDiscuss: (update: StartupRadarUpdate) => void;
  onClose: () => void;
};

export function StartupRadarPanel({
  startupName,
  niche,
  updates,
  loadingLive,
  reduceMotion,
  onDiscuss,
  onClose,
}: StartupRadarPanelProps) {
  return (
    <motion.section
      className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={GPU}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
            <Radio className="h-3.5 w-3.5" />
            Live Startup Updates
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white md:text-2xl">
            Live market updates for {startupName}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Signals for {niche?.trim() || "your active niche"}. Watchtower items appear first when they exist.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-zinc-400 backdrop-blur-xl hover:text-white"
          aria-label="Back to chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loadingLive && (
        <p className="text-xs text-zinc-500">Checking saved Watchtower signals…</p>
      )}

      <motion.div
        className="space-y-3"
        variants={list}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        {updates.map((update) => (
          <motion.article
            key={update.id}
            variants={card}
            style={GPU}
            className="rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-4 backdrop-blur-xl md:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#A3E635]/25 bg-[#A3E635]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#D9F99D]">
                {update.category}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500">{update.source}</span>
              <span className="ml-auto text-xs font-bold text-[#A3E635]">
                Opportunity {update.score}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold leading-snug text-white">{update.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{update.explanation}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Why it happened</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{update.why}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Impact on {startupName}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{update.impact}</p>
              </div>
            </div>
            {update.sourceLink && (
              <a
                href={update.sourceLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-[11px] font-semibold text-[#A3E635] hover:underline"
              >
                Open source
              </a>
            )}
            <button
              type="button"
              onClick={() => onDiscuss(update)}
              className="mt-4 cursor-pointer rounded-xl bg-[#A3E635] px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-[#84CC16] hover:shadow-[0_0_20px_rgba(163,230,53,0.28)]"
            >
              Discuss with AI Mentor
            </button>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}
