"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Rocket, X } from "lucide-react";

import { fetchOpportunityDeepDive } from "@/app/actions/intelligence";
import { saveOpportunity } from "@/app/actions/opportunities";
import { OpportunityDeepDivePanel } from "@/components/dashboard/opportunity-deep-dive";
import {
  checkOpportunityView,
  incrementOpportunityView,
} from "@/app/actions/usage";
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
        <span className="text-zinc-500">{label}</span>
        <span className="tabular-nums text-zinc-300">{value}/100</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
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
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBuilding, startBuildTransition] = useTransition();
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [enrichedOpportunity, setEnrichedOpportunity] =
    useState<Opportunity | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSaved(false);
    setSaveError(null);
    setBuildError(null);
    setViewError(null);

    if (!selectedOpportunity) {
      setEnrichedOpportunity(null);
      return;
    }

    setEnrichedOpportunity(selectedOpportunity);

    void (async () => {
      const gate = await checkOpportunityView();
      if (!gate.allowed) {
        setViewError(gate.reason ?? "Daily view limit reached");
        return;
      }
      await incrementOpportunityView();
    })();

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
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#08080c]/90 shadow-[-32px_0_100px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
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
                <p className="mt-1 text-sm text-zinc-500">
                  {selectedOpportunity.category}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="shrink-0 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {viewError && (
                <div
                  className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-300"
                  role="alert"
                >
                  {viewError}
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Technical scores
              </p>
              <div className="mt-4 space-y-4">
                <ScoreBar
                  label="Demand"
                  value={selectedOpportunity.scores.demand}
                />
                <ScoreBar
                  label="Competition"
                  value={selectedOpportunity.scores.competition}
                />
                <ScoreBar
                  label="Virality"
                  value={selectedOpportunity.scores.virality}
                />
                <ScoreBar
                  label="Monetization"
                  value={selectedOpportunity.scores.monetization}
                />
                {selectedOpportunity.scores.disruption != null && (
                  <ScoreBar
                    label="AI Disruption"
                    value={selectedOpportunity.scores.disruption}
                  />
                )}
              </div>

              <div className="mt-8">
                <OpportunityDrawerDetail
                  key={`${selectedOpportunity.id}-${activeWorkspace}`}
                  opportunity={enrichedOpportunity ?? selectedOpportunity}
                  activeWorkspace={activeWorkspace}
                />
              </div>

              <OpportunityDeepDivePanel
                opportunity={enrichedOpportunity ?? selectedOpportunity}
                loading={deepDiveLoading}
              />

              <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#deff9a]/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Revenue potential estimate
                </p>
                <p className="mt-1 text-lg font-semibold text-[#deff9a]">
                  {selectedOpportunity.revenuePotential}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Verified sources
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOpportunity.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 space-y-2 border-t border-white/[0.06] p-4 sm:p-5">
              {buildError && (
                <p className="text-center text-[11px] text-red-400">{buildError}</p>
              )}
              {saveError && (
                <p className="text-center text-[11px] text-red-400">{saveError}</p>
              )}
              <Button
                onClick={handleBuildStartup}
                disabled={isBuilding}
                className="btn-glow-lime w-full bg-[#deff9a] font-semibold text-black hover:bg-[#d8f992]"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating workspace…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    🚀 Build This Startup
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || saved}
                className="btn-glow-lime w-full bg-[#deff9a] font-semibold text-black hover:bg-[#d8f992] disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Signal saved
                  </>
                ) : (
                  "Save signal"
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
