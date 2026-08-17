"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Cpu,
  HelpCircle,
  Layers,
  Loader2,
  Rocket,
  ShieldAlert,
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
  const [, setSaveError] = useState<string | null>(null);
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

  // ✅ Safe Guard: Sabhi hooks declare hone ke baad return (React rules maintained)
  if (!mounted || !selectedOpportunity) return null;

  const currentOp = enrichedOpportunity ?? selectedOpportunity;
  const deepDive = currentOp?.deepDive;

  const defaultPainPoints = [
    {
      title: "🎙️ High Production & Recording Effort",
      desc: "Creating professional media or audio manually requires expensive studio gear, room soundproofing, and endless re-recordings when mistakes happen.",
    },
    {
      title: "💰 Expensive Freelancer / Agency Fees",
      desc: "Hiring voiceover artists or digital agencies costs $50 to $200 per single task, quickly draining small operational budgets.",
    },
    {
      title: "⏳ Slow Delivery & Bottlenecks",
      desc: "Waiting days for freelancers to deliver edits halts marketing schedules and delays key product launches.",
    },
  ];

  const defaultSolutionSteps = [
    {
      step: "Step 1: Paste Your Script or Input",
      desc: "Paste your text script into the simple web dashboard. No technical coding, microphone, or software setup required.",
    },
    {
      step: "Step 2: AI Enhances & Renders Studio Audio",
      desc: "The AI engine selects human-like voices, removes background noise automatically, and balances speech tone instantly.",
    },
    {
      step: "Step 3: Instant 1-Click Export",
      desc: "Download high-definition ready-to-use audio files immediately or publish directly to your YouTube and video platforms.",
    },
  ];

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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 md:px-16 lg:px-24 pb-32">
              <div className="mx-auto max-w-5xl space-y-8">

                {/* Main Hero Banner */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-8 md:p-10 shadow-2xl relative overflow-hidden">
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

                  <div className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-950/20 p-5 flex items-start gap-3.5 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                    <HelpCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">In Simple Terms (For Beginners)</p>
                      <p className="text-sm font-semibold text-amber-100 mt-1 leading-relaxed">
                        {deepDive?.valueProp || `${selectedOpportunity.name} allows anyone to create professional studio voiceovers by simply pasting text, saving thousands on voice actors.`}
                      </p>
                    </div>
                  </div>

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
                    <p className="text-sm font-medium">Analyzing market context & generating beginner breakdown...</p>
                  </div>
                )}

                {/* CONTAINER 1: THE CORE PROBLEM */}
                <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-500/[0.06] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">1. The Core Problem</h2>
                      <p className="text-xs text-zinc-400">Exact real-world pain points that customers face today.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    {deepDive?.painPoints?.length
                      ? deepDive.painPoints.map((pain, idx) => (
                          <div key={idx} className="rounded-2xl border border-red-500/15 bg-black/50 p-6 space-y-2.5">
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wide">Pain Point #{idx + 1}</div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{pain}</p>
                          </div>
                        ))
                      : defaultPainPoints.map((item, idx) => (
                          <div key={idx} className="rounded-2xl border border-red-500/15 bg-black/50 p-6 space-y-2.5">
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wide">{item.title}</div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                  </div>
                </div>

                {/* CONTAINER 2: HOW YOUR STARTUP SOLVES IT */}
                <div className="rounded-3xl border border-[#deff9a]/25 bg-gradient-to-b from-[#deff9a]/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#deff9a]/20 text-[#deff9a]">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">2. How Your Startup Solves It</h2>
                      <p className="text-xs text-zinc-400">Simple 3-step product workflow designed for effortless execution.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    {deepDive?.solutionFeatures?.length
                      ? deepDive.solutionFeatures.map((feat, idx) => (
                          <div key={idx} className="rounded-2xl border border-[#deff9a]/15 bg-black/50 p-6 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a] uppercase tracking-wide">
                              <CheckCircle2 className="h-4 w-4" /> Workflow Step #{idx + 1}
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{feat}</p>
                          </div>
                        ))
                      : defaultSolutionSteps.map((item, idx) => (
                          <div key={idx} className="rounded-2xl border border-[#deff9a]/15 bg-black/50 p-6 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#deff9a] uppercase tracking-wide">
                              <CheckCircle2 className="h-4 w-4 text-[#deff9a]" /> {item.step}
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                  </div>
                </div>

                {/* CONTAINER 3: TARGET AUDIENCE */}
                <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">3. Who Will Pay You</h2>
                      <p className="text-xs text-zinc-400">Exact customer personas desperate for this solution.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {deepDive?.targetAudience?.length ? (
                      deepDive.targetAudience.map((aud, idx) => (
                        <div key={idx} className="flex items-start gap-3.5 rounded-2xl border border-sky-500/15 bg-black/50 p-6">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-sky-400 uppercase tracking-wide">Customer Segment #{idx + 1}</p>
                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{aud}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3.5 rounded-2xl border border-sky-500/15 bg-black/50 p-6">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-sky-400 uppercase tracking-wide">YouTube Creators & Podcasters</p>
                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">Publishers making 3–5 videos a week who want fast voiceovers without hiring expensive talent.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3.5 rounded-2xl border border-sky-500/15 bg-black/50 p-6">
                          <Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-sky-400 uppercase tracking-wide">E-Learning & Course Creators</p>
                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">Educators building online courses who need clean, consistent audio explanation across dozens of modules.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* CONTAINER 4: TECH STACK & MONETIZATION */}
                <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">4. Simple Tech Stack & Monetization</h2>
                      <p className="text-xs text-zinc-400">How to build MVP and charge your first paid users.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                        <Layers className="h-4 w-4" /> Recommended Tech
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Next.js + Tailwind CSS, Supabase DB, connected to OpenAI / ElevenLabs Audio API endpoints.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        <Coins className="h-4 w-4" /> Monthly Pricing
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        $29/mo Starter (50 minutes voice audio) & $79/mo Pro Plan (Unlimited audio + priority AI voices).
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wide">
                        <TrendingUp className="h-4 w-4" /> Go-To-Market
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Post before/after audio clips on Twitter/X, launch on ProductHunt, and DM video creators.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Launch Call-To-Action */}
                <div className="rounded-3xl border border-[#deff9a]/30 bg-[#deff9a]/[0.05] p-8 text-center space-y-4 shadow-[0_0_50px_rgba(222,255,154,0.15)]">
                  <h3 className="text-2xl font-extrabold text-white">Ready to Build This Startup?</h3>
                  <p className="text-xs text-zinc-300 max-w-xl mx-auto leading-relaxed">
                    Launch your dedicated execution workspace equipped with custom AI modules, MVP architecture specs, and step-by-step roadmap tools.
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
                        Creating Workspace...
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