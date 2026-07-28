"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

import { fetchOpportunityDeepDive } from "@/app/actions/intelligence";
import { saveOpportunity } from "@/app/actions/opportunities";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { createWorkspaceFromOpportunity } from "@/app/actions/workspaces";
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

    if (selectedOpportunity.deepDive) return;

    setDeepDiveLoading(true);
    void (async () => {
      const seed = selectedOpportunity.keywords[0] ?? selectedOpportunity.name;
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

  const currentOp = enrichedOpportunity ?? selectedOpportunity;
  const deepDive = currentOp?.deepDive;

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
            className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-[540px] flex-col border-l border-white/10 bg-[#08080c] shadow-[-32px_0_100px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            {/* Top Bar Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] bg-[#08080c]/90 px-5 py-4 sm:px-6 backdrop-blur-md">
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
                    <Sparkles className="mr-1 h-3 w-3" />
                    Demand Confidence {selectedOpportunity.aiConfidence}%
                  </Badge>
                </div>
                <h2
                  id="drawer-title"
                  className="mt-2 text-xl font-bold leading-snug text-white"
                >
                  {selectedOpportunity.name}
                </h2>
                <p className="mt-1 text-xs font-medium text-zinc-400">
                  Category: {selectedOpportunity.category}
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

            {/* Scrollable Content Body (100% Simplified Daily English Breakdown) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6 space-y-6 pb-28">
              {/* Beginner Guidance Alert */}
              <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.03] p-4">
                <p className="text-xs font-semibold text-[#deff9a] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Beginner Founder Clarity Card
                </p>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                  Here is the simple, real-world breakdown of what this startup idea actually is, who needs it, and how it makes money.
                </p>
              </div>

              {deepDiveLoading && (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#deff9a]" />
                  Loading simple startup breakdown...
                </div>
              )}

              {/* 🔴 CARD 1: THE PAINFUL PROBLEM */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  1. The Painful Problem (Problem Kya Hai?)
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {selectedOpportunity.description}
                </p>

                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400">
                    Why users are struggling today:
                  </p>
                  {deepDive?.painPoints?.length ? (
                    deepDive.painPoints.map((pain, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                      >
                        <span className="text-red-400 font-bold">•</span>
                        <span>{pain}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Existing tools are too manual, complex, or expensive for normal people.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-red-400 font-bold">•</span>
                        <span>People waste hours every week trying to do this manually.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 🟢 CARD 2: HOW THIS STARTUP SOLVES IT */}
              <div className="rounded-2xl border border-[#deff9a]/25 bg-[#deff9a]/[0.03] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#deff9a]">
                  <CheckCircle2 className="h-4 w-4" />
                  2. How This Startup Solves It (Simple Solution)
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  {deepDive?.valueProp || `An easy automated tool designed specifically for ${selectedOpportunity.category.toLowerCase()} users.`}
                </p>

                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400">How it works step-by-step:</p>
                  {deepDive?.solutionFeatures?.length ? (
                    deepDive.solutionFeatures.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                      >
                        <span className="text-[#deff9a] font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-[#deff9a] font-bold">✓</span>
                        <span>Connect or input requirements in a simple 1-click dashboard.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-[#deff9a] font-bold">✓</span>
                        <span>Automated engine processes the task instantly without technical setup.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 🎯 CARD 3: TARGET AUDIENCE */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.03] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <Users className="h-4 w-4" />
                  3. Target Audience (Ye Kiske Kaam Aayega?)
                </div>

                <div className="mt-3 space-y-2">
                  {deepDive?.targetAudience?.length ? (
                    deepDive.targetAudience.map((aud, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-zinc-200"
                      >
                        <Target className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span>{aud}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-zinc-200">
                      <Target className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span>Small Business Owners, Creators & Online Agencies</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 📊 CARD 4: FEASIBILITY & REVENUE SCORE */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <Coins className="h-4 w-4 text-[#deff9a]" />
                    4. Opportunity Feasibility & Revenue
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-semibold">Demand Score</p>
                    <p className="mt-1 text-lg font-bold text-[#deff9a]">
                      {selectedOpportunity.scores.demand}/100
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-semibold">Est. Revenue</p>
                    <p className="mt-1 text-xs font-bold text-white">
                      {selectedOpportunity.revenuePotential}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Fixed Action Bar */}
            <div className="shrink-0 space-y-2.5 border-t border-white/10 bg-[#08080c]/95 p-4 sm:p-5 backdrop-blur-md shadow-[0_-12px_32px_rgba(0,0,0,0.8)] z-10">
              {buildError && (
                <p className="text-center text-[11px] font-medium text-red-400">{buildError}</p>
              )}
              {saveError && (
                <p className="text-center text-[11px] font-medium text-red-400">{saveError}</p>
              )}

              {/* Primary Glowing Action Button */}
              <Button
                onClick={handleBuildStartup}
                disabled={isBuilding}
                className="w-full bg-[#deff9a] text-black font-bold hover:bg-[#c9f578] shadow-[0_0_24px_rgba(222,255,154,0.35)] transition-all h-12 text-sm cursor-pointer"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Startup Workspace…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4 fill-black" />
                    🚀 Build Your Startup (Launch Workspace)
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={isPending || saved}
                variant="outline"
                className="w-full border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:border-white/25 disabled:opacity-60 h-10 text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-[#deff9a]" />
                    Signal Saved to Workspace
                  </>
                ) : (
                  <>
                    Save Signal for Later
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