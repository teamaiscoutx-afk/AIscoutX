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
Flame,
Skull,
DollarSign,
AlertTriangle,
ChevronRight,
} from "lucide-react";

import { fetchOpportunityDeepDive } from "@/app/actions/intelligence";
import { isFounderUiDeepDive } from "@/lib/intelligence/founder-blueprint-azure";
import { saveOpportunity } from "@/app/actions/opportunities";
import { persistActiveWorkspace } from "@/lib/workspace/active-workspace";
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

if (isFounderUiDeepDive(selectedOpportunity.deepDive)) {
  return;
}

setDeepDiveLoading(true);
void (async () => {
const result = await fetchOpportunityDeepDive(selectedOpportunity);
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
persistActiveWorkspace({
id: result.workspaceId,
name: result.workspaceName ?? selectedOpportunity.name,
});
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

if (!mounted || !selectedOpportunity) return null;

const currentOp = enrichedOpportunity ?? selectedOpportunity;
const deepDive = currentOp?.deepDive;

const insightText =
  deepDive?.valueProp ??
  (deepDiveLoading
    ? "Generating a bespoke blueprint for this concept…"
    : currentOp.drawer.whyThisMatters);

const painPoints =
  deepDive?.painPoints?.length
    ? deepDive.painPoints
    : deepDiveLoading
      ? []
      : [
          currentOp.intelligence.founder.problem,
          `Manual workflows in ${currentOp.category} drain time and budget.`,
          "Incumbent tools are too generic for this niche ICP.",
        ];

const solutionSteps =
  deepDive?.solutionFeatures?.length
    ? deepDive.solutionFeatures
    : deepDiveLoading
      ? []
      : [
          currentOp.intelligence.founder.solution,
          currentOp.intelligence.founder.mvp,
          `Launch window: ${currentOp.intelligence.founder.launchTime}`,
        ];

const targetAudience =
  deepDive?.targetAudience?.length
    ? deepDive.targetAudience
    : deepDiveLoading
      ? []
      : [currentOp.drawer.targetClients, currentOp.intelligence.agency.icp].filter(Boolean);

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
{currentOp.drawer.whyThisMatters}
</p>

<div className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-950/20 p-5 flex items-start gap-3.5 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.1)]">
<HelpCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
<div>
<p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
💡 Co-Founder Insight (In Simple Terms)
</p>
<p className="text-sm font-semibold text-amber-100 mt-1 leading-relaxed">
{insightText}
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
<p className="text-xl font-bold text-amber-400 mt-1">
{currentOp.intelligence.founder.launchTime}
</p>
</div>
</div>
</div>

{deepDiveLoading && (
<div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-zinc-400 space-y-3">
<Loader2 className="h-8 w-8 animate-spin text-[#deff9a] mx-auto" />
<p className="text-sm font-medium">Analyzing market context & generating beginner breakdown...</p>
</div>
)}

{/* VETERAN MENTOR SECTION: RISK RADAR & WHAT NOT TO BUILD */}
<div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-500/10 via-rose-950/10 to-transparent p-8 space-y-6 relative overflow-hidden">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
<Skull className="h-5 w-5" />
</div>
<div>
<h2 className="text-xl font-bold text-white flex items-center gap-2">
Mentor's Risk Radar <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Reality Check</span>
</h2>
<p className="text-xs text-zinc-400">Why this idea might fail and what to strictly cut from V1.</p>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
<div className="rounded-2xl border border-rose-500/20 bg-black/60 p-6 space-y-3">
<div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide">
<AlertTriangle className="h-4 w-4" /> Why Most Founders Fail Here
</div>
<p className="text-xs text-zinc-300 leading-relaxed">
{deepDive?.riskRadar?.whyFoundersFail ??
  (deepDiveLoading
    ? "Analyzing risk patterns for this market…"
    : `Validate willingness-to-pay for ${selectedOpportunity.name} before expanding scope.`)}
</p>
</div>

<div className="rounded-2xl border border-amber-500/20 bg-black/60 p-6 space-y-3">
<div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
<X className="h-4 w-4" /> What NOT to Build in V1 (Scope Freeze)
</div>
<ul className="text-xs text-zinc-300 space-y-2">
{(deepDive?.riskRadar?.scopeFreezeSkip?.length
  ? deepDive.riskRadar.scopeFreezeSkip
  : deepDiveLoading
    ? ["Loading scope guidance…"]
    : ["Enterprise multi-tenant admin", "Custom integrations marketplace"]
).map((item) => (
<li key={item} className="flex items-center gap-2">
<span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
<span><strong>Skip:</strong> {item}</span>
</li>
))}
{deepDive?.riskRadar?.scopeFreezeBuild && (
<li className="flex items-center gap-2 pt-1">
<span className="h-1.5 w-1.5 rounded-full bg-[#deff9a]" />
<span><strong>Build:</strong> {deepDive.riskRadar.scopeFreezeBuild}</span>
</li>
)}
</ul>
</div>
</div>
</div>

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
{painPoints.map((pain, idx) => (
<div key={idx} className="rounded-2xl border border-red-500/15 bg-black/50 p-6 space-y-2.5">
<div className="text-xs font-bold text-red-400 uppercase tracking-wide">Pain Point #{idx + 1}</div>
<p className="text-xs text-zinc-300 leading-relaxed">{pain}</p>
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
{solutionSteps.map((feat, idx) => (
<div key={idx} className="rounded-2xl border border-[#deff9a]/15 bg-black/50 p-6 space-y-2.5">
<div className="flex items-center gap-2 text-xs font-bold text-[#deff9a] uppercase tracking-wide">
<CheckCircle2 className="h-4 w-4" /> Workflow Step #{idx + 1}
</div>
<p className="text-xs text-zinc-300 leading-relaxed">{feat}</p>
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
{targetAudience.map((aud, idx) => (
<div key={idx} className="flex items-start gap-3.5 rounded-2xl border border-sky-500/15 bg-black/50 p-6">
<Target className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
<div>
<p className="text-xs font-bold text-sky-400 uppercase tracking-wide">Customer Segment #{idx + 1}</p>
<p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{aud}</p>
</div>
</div>
))}
</div>
</div>

{/* VETERAN MENTOR SECTION: FIRST 10 CUSTOMERS PLAYBOOK */}
<div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.05] to-transparent p-8 space-y-6">
<div className="flex items-center gap-3">
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
<Flame className="h-5 w-5" />
</div>
<div>
<h2 className="text-xl font-bold text-white">4. First 10 Customers Playbook (0 to 1)</h2>
<p className="text-xs text-zinc-400">Exact tactical distribution plan—no fluff, pure execution.</p>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
{[
{ label: "Days 1–3", text: deepDive?.playbook?.days1To3 },
{ label: "Days 4–7", text: deepDive?.playbook?.days4To7 },
{ label: "Days 8–14", text: deepDive?.playbook?.days8To14 },
].map((block) => (
<div key={block.label} className="rounded-2xl border border-emerald-500/15 bg-black/50 p-6 space-y-2">
<div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{block.label}</div>
<p className="text-xs text-zinc-300 leading-relaxed">
{block.text ??
  (deepDiveLoading
    ? "Generating playbook…"
    : `Execute focused outreach for ${selectedOpportunity.name} in ${selectedOpportunity.category}.`)}
</p>
</div>
))}
</div>
</div>

{/* CONTAINER 5: TECH STACK & UNIT ECONOMICS */}
<div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-8 space-y-6">
<div className="flex items-center gap-3">
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
<Cpu className="h-5 w-5" />
</div>
<div>
<h2 className="text-xl font-bold text-white">5. Tech Stack & Unit Economics</h2>
<p className="text-xs text-zinc-400">How to build MVP and ensure healthy gross margins.</p>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
<div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
<div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
<Layers className="h-4 w-4" /> Recommended Tech
</div>
<p className="text-xs text-zinc-300 leading-relaxed">
{deepDive?.techAndEconomics?.techStack ??
  (deepDiveLoading ? "Mapping stack…" : "Next.js, Supabase, Azure OpenAI — tuned to this product surface.")}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
<div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
<DollarSign className="h-4 w-4" /> Margins & Pricing
</div>
<p className="text-xs text-zinc-300 leading-relaxed">
{deepDive?.techAndEconomics?.pricingAndMargins ?? selectedOpportunity.revenuePotential}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-black/50 p-6 space-y-2.5">
<div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wide">
<TrendingUp className="h-4 w-4" /> Breakeven Point
</div>
<p className="text-xs text-zinc-300 leading-relaxed">
{deepDive?.techAndEconomics?.breakeven ??
  "Model breakeven after first 10–15 paying customers at starter pricing."}
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
