"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Trash2 } from "lucide-react";

import type { UsageSnapshot } from "@/app/actions/usage";
import { moveVenturePackToTrash } from "@/app/actions/trash";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { FeatureMatrixGrid } from "@/components/mvp/feature-matrix-grid";
import { UsageBadge } from "@/components/mvp/tier-gate";
import { PDF_EXPORT_MESSAGE } from "@/lib/billing/tier-limits";
import { listFeatureStrings } from "@/lib/mvp/normalize-features";
import { clearVenturePackLocal } from "@/lib/mvp/venture-pack-storage";
import type { VenturePack } from "@/lib/mvp/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BlueprintsViewProps = {
  pack: VenturePack | null;
  usage: UsageSnapshot;
};

export function BlueprintsView({ pack, usage }: BlueprintsViewProps) {
  const router = useRouter();
  const { openUpgradeModal } = useUpgradeModal();
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function handleExportPdf() {
    if (!usage.isPaid) {
      openUpgradeModal(PDF_EXPORT_MESSAGE);
      return;
    }
    window.print();
  }

  function handleMoveToBin() {
    if (!pack || deleting) return;
    setDeleting(true);
    startTransition(async () => {
      // Persisted packs go to the recoverable Trash; local-only packs are cleared.
      if (UUID_REGEX.test(pack.id)) {
        await moveVenturePackToTrash(pack.id);
      }
      clearVenturePackLocal();
      router.push("/dashboard/discover");
      router.refresh();
    });
  }

  if (!pack) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-white">No blueprint yet</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Generate a venture pack from Discover to unlock tech stack, features, and roadmap.
        </p>
        <a href="/dashboard/discover" className="mt-4 inline-block text-sm text-[#deff9a] hover:underline">
          Generate blueprint →
        </a>
      </div>
    );
  }

  const { blueprint } = pack;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
            Module 3 · Blueprints
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Execution blueprint</h1>
          <p className="mt-1 text-sm text-zinc-500">Query: &ldquo;{pack.query}&rdquo;</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <UsageBadge usage={usage} />
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#deff9a]/25 bg-[#deff9a]/10 px-3 py-1.5 text-xs font-medium text-[#deff9a] transition-colors hover:bg-[#deff9a]/20"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleMoveToBin}
            disabled={deleting}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/[0.05] px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Moving…" : "Move to Bin"}
          </button>
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Name suggestions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {blueprint.nameSuggestions.map((name) => (
            <span
              key={name}
              className="rounded-full border border-[#deff9a]/20 bg-[#deff9a]/10 px-3 py-1 text-xs text-[#deff9a]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">Feature requirements</h2>
        <FeatureMatrixGrid
          features={
            (blueprint as { features?: unknown }).features ?? blueprint.featureMatrix
          }
          className="mt-4"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Recommended tech stack</h2>
          <ul className="mt-4 space-y-3">
            {blueprint.techStack.map((row) => (
              <li key={row.layer} className="rounded-xl border border-white/[0.06] p-3">
                <p className="text-xs font-medium text-[#deff9a]">{row.layer}</p>
                <p className="text-sm text-white">{row.recommendation}</p>
                <p className="mt-1 text-xs text-zinc-500">{row.rationale}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white">Pricing structure</h2>
          <ul className="mt-4 space-y-3">
            {blueprint.pricingTiers.map((tier) => (
              <li key={tier.name} className="rounded-xl border border-white/[0.06] p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-white">{tier.name}</span>
                  <span className="text-sm text-[#deff9a]">{tier.price}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {listFeatureStrings(tier.features).map((f) => (
                    <li key={f} className="text-xs text-zinc-500">
                      · {f}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white">4-week milestone map</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {blueprint.roadmap.map((week) => (
            <div key={week.week} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]">
                Week {week.week}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{week.milestone}</p>
              <ul className="mt-2 space-y-1">
                {week.tasks.map((t) => (
                  <li key={t} className="text-xs text-zinc-500">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
