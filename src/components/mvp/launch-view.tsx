"use client";

import { Copy } from "lucide-react";

import type { VenturePack } from "@/lib/mvp/types";

type LaunchViewProps = {
  pack: VenturePack | null;
};

export function LaunchView({ pack }: LaunchViewProps) {
  if (!pack) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-white">No launch plan yet</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Generate a venture pack to unlock GTM playbooks and outreach scripts.
        </p>
        <a href="/dashboard/discover" className="mt-4 inline-block text-sm text-[#deff9a] hover:underline">
          Generate launch pack →
        </a>
      </div>
    );
  }

  const { launch } = pack;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
        Module 4 · Launch Plan
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">GTM &amp; distribution</h1>
      <p className="mt-1 text-sm text-zinc-500">Query: &ldquo;{pack.query}&rdquo;</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {launch.platforms.map((platform) => (
          <div key={platform.platform} className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#deff9a]">{platform.platform}</h2>
            <ul className="mt-3 space-y-2">
              {platform.playbook.map((step) => (
                <li key={step} className="text-xs text-zinc-400">
                  · {step}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Sample post
                </p>
                <Copy className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {platform.samplePost}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Cold outreach scripts</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {launch.outreachScripts.map((script) => (
            <div
              key={script.channel}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="text-xs font-medium text-[#deff9a]">{script.channel}</p>
              <p className="mt-2 text-sm font-medium text-white">{script.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-400">
                {script.body}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
