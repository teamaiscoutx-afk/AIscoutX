"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, Loader2, Rocket, X } from "lucide-react";

import { fetchOpportunityDeepDive } from "@/app/actions/intelligence";
import { saveOpportunity } from "@/app/actions/opportunities";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { OpportunityDeepDivePanel } from "@/components/dashboard/opportunity-deep-dive";
import { createWorkspaceFromOpportunity } from "@/app/actions/workspaces";
import { OpportunityDrawerDetail } from "@/components/dashboard/opportunity-drawer-detail";
import {
  getTrendStageColor,
  type Opportunity,
} from "@/lib/dashboard/opportunities";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OpportunityDrawerProps = {
  selectedOpportunity: Opportunity | null;
  activeWorkspace: WorkspaceIdentity;
  onClose: () => void;
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="tabular-nums font-semibold text-[#deff9a]">{value}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className="h-full rounded-full bg-gradient-to-r from-[#deff9a]/60 to-[#deff9a] shadow-[0_0_12px_rgba(222,255,154,0.35)]"
        />
      </div>
    </div>
  );
}

export function OpportunityDrawer({
  selectedOpportunity,
  activeWorkspace,
  onClose,
}: OpportunityDrawerProps) {
  const router = useRouter();
  const { openUpgradeModal } = useUpgradeModal();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBuilding, startBuildTransition] = useTransition();
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveLocked, setDeepDiveLocked] = useState(false);
  const [enrichedOpportunity, setEnrichedOpportunity] =
    useState<Opportunity | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSaved(false);
    setSaveError(null);
    setBuildError(null);

    if (!selectedOpportunity) {
      setEnrichedOpportunity(null);
      return;
    }

    setEnrichedOpportunity(selectedOpportunity);

    setDeepDiveLocked(false);
    if (selectedOpportunity.deepDive) return;

    setDeepDiveLoading(true);
    void (async () => {
      const seed =
        selectedOpportunity.keywords[0] ??
        selectedOpportunity.name;
      const result = await fetchOpportunityDeepDive(
        selectedOpportunity.id,
        seed
      );
      if (result.ok && result.deepDive) {
        setEnrichedOpportunity({
          ...selectedOpportunity,
          deepDive: result.deepDive,
        });
      } else if (result.code === "UPGRADE_REQUIRED") {
        setDeepDiveLocked(true);
      }
      setDeepDiveLoading(false);
    })();
  }, [selectedOpportunity]);

  function handleBuildStartup() {
    if (!selectedOpportunity) return;
    startBuildTransition(async () => {
      const result = await createWorkspaceFromOpportunity(selectedOpportunity);
      if (result.ok && result.workspaceId) {
        router.push(`/dashboard/workspace/${result.workspaceId}`);
        onClose();
        return;
      }
      if (result.code === "UPGRADE_REQUIRED") {
        openUpgradeModal(result.error);
        return;
      }
      setBuildError(result.error ?? "Could not create startup workspace.");
    });
  }

  function handleSave() {
    if (!selectedOpportunity) return;
    startTransition(async () => {
      const result = await saveOpportunity(selectedOpportunity.id);
      if (result.ok) {
        setSaved(true);
        setSaveError(null);
      } else {
        setSaveError(result.error ?? "Could not save signal.");
      }
    });
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {selectedOpportunity && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-[480px] flex-col border-l border-white/10 bg-[#08080c] shadow-[-32px_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] bg-[#08080c]/80 px-5 py-4 sm:px-6 backdrop-blur-md">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getTrendStageColor(
                      selectedOpportunity.trendStage
                    )}
                  >
                    {selectedOpportunity.trendStage}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a]"
                  >
                    AI Confidence {selectedOpportunity.aiConfidence}%
                  </Badge>
                </div>
                <h2
                  id="drawer-title"
                  className="mt-2 text-lg font-semibold leading-tight text-white"
                >
                  {selectedOpportunity.name}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {selectedOpportunity.category}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="shrink-0 border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 pb-24">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Technical scores
                </p>
                <span className="text-[10px] text-zinc-500">Live signals engine</span>
              </div>

              <div className="mt-3 space-y-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <ScoreBar
                  label="Demand Score"
                  value={selectedOpportunity.scores.demand}
                />
                <ScoreBar
                  label="Competition Density"
                  value={selectedOpportunity.scores.competition}
                />
                <ScoreBar
                  label="Virality Potential"
                  value={selectedOpportunity.scores.virality}
                />
                <ScoreBar
                  label="Monetization Velocity"
                  value={selectedOpportunity.scores.monetization}
                />
                {selectedOpportunity.scores.disruption != null && (
                  <ScoreBar
                    label="AI Disruption Risk"
                    value={selectedOpportunity.scores.disruption}
                  />
                )}
              </div>

              <div className="mt-6">
                <OpportunityDrawerDetail
                  key={`${selectedOpportunity.id}-${activeWorkspace}`}
                  opportunity={enrichedOpportunity ?? selectedOpportunity}
                  activeWorkspace={activeWorkspace}
                />
              </div>

              {deepDiveLocked ? (
                <button
                  type="button"
                  onClick={() =>
                    openUpgradeModal(
                      "Deep Dive specs are a Pro feature. Upgrade to see cited market gaps and MVP anatomy."
                    )
                  }
                  className="mt-6 w-full rounded-xl border border-[#deff9a]/25 bg-[#deff9a]/[0.05] p-5 text-left transition-colors hover:bg-[#deff9a]/[0.08]"
                >
                  <p className="text-sm font-semibold text-[#deff9a]">
                    🔒 Deep Dive locked
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    Real market gaps, a full solution blueprint, and the exact
                    MVP anatomy live behind Pro. Tap to unlock.
                  </p>
                </button>
              ) : (
                <OpportunityDeepDivePanel
                  opportunity={enrichedOpportunity ?? selectedOpportunity}
                  loading={deepDiveLoading}
                />
              )}

              <div className="mt-6 rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Revenue potential estimate
                </p>
                <p className="mt-1 text-lg font-semibold text-[#deff9a]">
                  {selectedOpportunity.revenuePotential}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Verified sources
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOpportunity.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Solid Sticky Action Bar (No Overlap) */}
            <div className="shrink-0 space-y-2.5 border-t border-white/10 bg-[#08080c]/95 p-4 sm:p-5 backdrop-blur-md shadow-[0_-12px_32px_rgba(0,0,0,0.8)] z-10">
              {buildError && (
                <p className="text-center text-[11px] font-medium text-red-400">{buildError}</p>
              )}
              {saveError && (
                <p className="text-center text-[11px] font-medium text-red-400">{saveError}</p>
              )}
              
              {/* Primary Build CTA */}
              <Button
                onClick={handleBuildStartup}
                disabled={isBuilding}
                className="w-full bg-[#deff9a] text-black font-semibold hover:bg-[#c9f578] shadow-[0_0_20px_rgba(222,255,154,0.3)] transition-all h-11"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating workspace…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4 fill-black" />
                    Build This Startup
                  </>
                )}
              </Button>

              {/* Secondary Save Signal CTA */}
              <Button
                onClick={handleSave}
                disabled={isPending || saved}
                variant="outline"
                className="w-full border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:border-white/25 disabled:opacity-60 h-10"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-[#deff9a]" />
                    Signal saved
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                    Save signal
                  </>
                )}
              </Button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}