"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Cpu,
  Layers,
  Loader2,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
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
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#040406]">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blueprint-title"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-full w-full flex-col bg-[#08080d] text-white overflow-hidden"
          >
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#08080d]/90 px-6 py-4 backdrop-blur-xl sm:px-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Discover
                </Button>
                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                  <span>/</span>
                  <span className="text-zinc-300 font-medium">Full Founder Blueprint</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isPending || saved}
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <span className="text-[#deff9a] flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Saved
                    </span>
                  ) : (
                    "Save Signal"
                  )}
                </Button>

                <Button
                  onClick={handleBuildStartup}
                  disabled={isBuilding}
                  size="sm"
                  className="bg-[#deff9a] text-black font-bold hover:bg-[#c9f578] shadow-[0_0_20px_rgba(222,255,154,0.3)] transition-all px-5"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4 fill-black" />
                      Build This Startup
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </header>

            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 md:px-16 lg:px-24 pb-32">
              <div className="mx-auto max-w-5xl space-y-10">
                
                {/* Header Title & Pitch */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles className="w-64 h-64 text-[#deff9a]" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="outline" className={getTrendStageColor(selectedOpportunity.trendStage)}>
                      {selectedOpportunity.trendStage} Stage
                    </Badge>
                    <Badge variant="outline" className="border-[#deff9a]/30 bg-[#deff9a]/10 text-[#deff9a] font-semibold">
                      🔥 AI Confidence {selectedOpportunity.aiConfidence}%
                    </Badge>
                    <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400">
                      Category: {selectedOpportunity.category}
                    </Badge>
                  </div>

                  <h1 id="blueprint-title" className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    {selectedOpportunity.name}
                  </h1>

                  <p className="mt-4 text-base md:text-lg text-zinc-300 font-normal leading-relaxed max-w-3xl">
                    {selectedOpportunity.description}
                  </p>

                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 pt-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Demand Score</p>
                      <p className="text-xl font-bold text-[#deff9a] mt-1">{selectedOpportunity.scores.demand}/100</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Competition Density</p>
                      <p className="text-xl font-bold text-sky-400 mt-1">{selectedOpportunity.scores.competition}/100</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Est. Monthly Revenue</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">{selectedOpportunity.revenuePotential}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Time To Build MVP</p>
                      <p className="text-xl font-bold text-amber-400 mt-1">2–3 Weeks</p>
                    </div>
                  </div>
                </div>

                {deepDiveLoading && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-zinc-400 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#deff9a] mx-auto" />
                    <p className="text-sm font-medium">Generating deep-dive beginner clarity points...</p>
                  </div>
                )}

                {/* 🔴 SECTION 1: THE REAL-WORLD PAINFUL PROBLEM */}
                <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-500/[0.06] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">1. The Painful Problem (Problem Kya Hai?)</h2>
                      <p className="text-xs text-zinc-400">What is broken right now and why users are desperately searching for a solution.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {deepDive?.painPoints?.length ? (
                      deepDive.painPoints.map((pain, idx) => (
                        <div key={idx} className="rounded-2xl border border-red-500/15 bg-black/40 p-5 space-y-2">
                          <div className="text-xs font-bold text-red-400">Pain Point #{idx + 1}</div>
                          <p className="text-sm text-zinc-200 leading-relaxed">{pain}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="rounded-2xl border border-red-500/15 bg-black/40 p-5 space-y-2">
                          <div className="text-xs font-bold text-red-400">Pain Point #1</div>
                          <p className="text-sm text-zinc-200 leading-relaxed">Current manual processes take 5+ hours per task, wasting critical founder time.</p>
                        </div>
                        <div className="rounded-2xl border border-red-500/15 bg-black/40 p-5 space-y-2">
                          <div className="text-xs font-bold text-red-400">Pain Point #2</div>
                          <p className="text-sm text-zinc-200 leading-relaxed">Hiring agencies or specialists is expensive ($500–$2,000 per month).</p>
                        </div>
                        <div className="rounded-2xl border border-red-500/15 bg-black/40 p-5 space-y-2">
                          <div className="text-xs font-bold text-red-400">Pain Point #3</div>
                          <p className="text-sm text-zinc-200 leading-relaxed">Existing software alternatives are too robotic, hard to setup, and lack quality.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 🟢 SECTION 2: HOW YOUR STARTUP SOLVES IT */}
                <div className="rounded-3xl border border-[#deff9a]/25 bg-gradient-to-b from-[#deff9a]/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#deff9a]/20 text-[#deff9a]">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">2. How Your Startup Solves It (The Product)</h2>
                      <p className="text-xs text-zinc-400">Simple 3-step product workflow that turns this problem into an easy 1-click software.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
                    <p className="text-sm font-medium text-[#deff9a]">
                      Core Value Proposition: {deepDive?.valueProp || `${selectedOpportunity.name} makes automated high-quality output accessible in seconds.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {deepDive?.solutionFeatures?.length ? (
                      deepDive.solutionFeatures.map((feat, idx) => (
                        <div key={idx} className="rounded-2xl border border-[#deff9a]/15 bg-black/40 p-5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a]">
                            <CheckCircle2 className="h-4 w-4" /> Feature #{idx + 1}
                          </div>
                          <p className="text-sm text-zinc-200 leading-relaxed">{feat}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="rounded-2xl border border-[#deff9a]/15 bg-black/40 p-5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a]">
                            <CheckCircle2 className="h-4 w-4" /> Step 1: Input
                          </div>
                          <p className="text-sm text-zinc-200 leading-relaxed">User inputs raw script or data into a clean, simple web dashboard.</p>
                        </div>
                        <div className="rounded-2xl border border-[#deff9a]/15 bg-black/40 p-5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a]">
                            <CheckCircle2 className="h-4 w-4" /> Step 2: Processing
                          </div>
                          <p className="text-sm text-zinc-200 leading-relaxed">AI engine automatically processes, edits, and optimizes output in real-time.</p>
                        </div>
                        <div className="rounded-2xl border border-[#deff9a]/15 bg-black/40 p-5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a]">
                            <CheckCircle2 className="h-4 w-4" /> Step 3: Export
                          </div>
                          <p className="text-sm text-zinc-200 leading-relaxed">One-click instant download or direct integration with user tools.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 👥 SECTION 3: TARGET AUDIENCE & CUSTOMERS */}
                <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">3. Target Audience (Ye Kiske Kaam Aayega?)</h2>
                      <p className="text-xs text-zinc-400">Exact people and businesses facing this exact pain point right now.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deepDive?.targetAudience?.length ? (
                      deepDive.targetAudience.map((aud, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-black/40 p-5">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-white">User Persona #{idx + 1}</p>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{aud}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-black/40 p-5">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-white">Creators & Solo Founders</p>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">People who need fast execution without spending huge budgets on freelancers.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-black/40 p-5">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-white">Digital Agencies & Marketers</p>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">Agencies scaling client work that need automated, consistent delivery.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 📊 SECTION 4: TECHNICAL FEASIBILITY & MONETIZATION */}
                <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">4. Tech Stack & Monetization Strategy</h2>
                      <p className="text-xs text-zinc-400">How to build this MVP fast and charge your first users.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <Layers className="h-4 w-4" /> Recommended Stack
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">Next.js + Tailwind CSS + OpenAI / ElevenLabs APIs + Supabase</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <Coins className="h-4 w-4" /> Pricing Model
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">$29/mo (Starter Plan) & $79/mo (Pro/Unlimited Plan)</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <TrendingUp className="h-4 w-4" /> Go-To-Market
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">Launch on ProductHunt, Reddit (r/SaaS), and Twitter cold outreach</p>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Call-To-Action Box */}
                <div className="rounded-3xl border border-[#deff9a]/30 bg-[#deff9a]/[0.05] p-8 text-center space-y-4 shadow-[0_0_50px_rgba(222,255,154,0.15)]">
                  <h3 className="text-2xl font-extrabold text-white">Ready to Turn This Idea Into Reality?</h3>
                  <p className="text-xs text-zinc-300 max-w-xl mx-auto leading-relaxed">
                    Clicking below will set up your personalized Founder Workspace with custom execution modules, GTM launchkits, and MVP specs.
                  </p>

                  {buildError && (
                    <p className="text-xs font-medium text-red-400">{buildError}</p>
                  )}

                  <Button
                    onClick={handleBuildStartup}
                    disabled={isBuilding}
                    size="lg"
                    className="bg-[#deff9a] text-black font-extrabold hover:bg-[#c9f578] shadow-[0_0_30px_rgba(222,255,154,0.4)] transition-all px-8 h-14 text-base cursor-pointer"
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Workspace...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5 fill-black" />
                        🚀 Build Your Startup (Launch Workspace)
                      </>
                    )}
                  </Button>
                </div>

              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}