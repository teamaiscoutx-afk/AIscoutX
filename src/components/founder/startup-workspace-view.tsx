"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Compass,
  Layers,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";

import { setWorkspaceActive } from "@/app/actions/notifications";
import { moveWorkspaceToTrash } from "@/app/actions/trash";
import { FounderGps } from "@/components/founder/founder-gps";
import { WorkspacePhasePanels } from "@/components/founder/workspace-phase-panels";
import type { DailyTask, StartupWorkspace } from "@/lib/founder/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "1. Overview & Strategy", emoji: "📋" },
  { id: "validation", label: "2. Market Validation", emoji: "🛡️" },
  { id: "competitors", label: "3. Competitor Gaps", emoji: "⚔️" },
  { id: "mvp", label: "4. Tech & MVP Spec", emoji: "🔧" },
  { id: "launch", label: "5. Go-To-Market Kit", emoji: "📢" },
  { id: "revenue", label: "6. Revenue Model", emoji: "💰" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: DailyTask[];
};

export function StartupWorkspaceView({
  initialWorkspace,
  initialTasks,
}: StartupWorkspaceViewProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [watching, setWatching] = useState(workspace.isActive);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function handleMoveToBin() {
    if (deleting) return;
    setDeleting(true);
    startTransition(async () => {
      const result = await moveWorkspaceToTrash(workspace.id);
      if (result.ok) {
        router.push("/dashboard/discover");
        router.refresh();
        return;
      }
      setDeleting(false);
    });
  }

  async function toggleWorkspaceWatch() {
    const next = !watching;
    const result = await setWorkspaceActive(workspace.id, next);
    if (result.ok) {
      setWatching(next);
      setWorkspace((prev) => ({ ...prev, isActive: next }));
    }
  }

  function handleBuildMvpClick() {
    setActiveTab("mvp");
    const targetElement = document.getElementById("workspace-tabs-section");
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(222,255,154,0.07),transparent_70%)] blur-3xl"
      />

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <Link
          href="/dashboard/discover"
          className="relative inline-flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-[#deff9a]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Discover Opportunities
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleWorkspaceWatch()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              watching
                ? "border-[#deff9a]/40 bg-[#deff9a]/10 text-[#deff9a] shadow-[0_0_12px_rgba(222,255,154,0.15)]"
                : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            {watching ? "Live Signal Watch Active" : "Enable Signal Watch"}
          </button>

          <button
            type="button"
            onClick={handleMoveToBin}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting…" : "Move to Bin"}
          </button>
        </div>
      </div>

      {/* Guided Founder Welcome Banner */}
      <div className="relative mt-6 rounded-2xl border border-[#deff9a]/20 bg-gradient-to-r from-[#deff9a]/[0.05] via-transparent to-transparent p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-3 py-1 text-[11px] font-semibold text-[#deff9a]">
              <Sparkles className="h-3 w-3" /> Founder Incubator HQ
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {workspace.summary.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
              {workspace.summary.category} — Execute the 6-phase execution blueprint below to turn this AI signal into a production-ready startup.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBuildMvpClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#deff9a] px-4 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(222,255,154,0.25)] transition-all hover:bg-[#c9f578] active:scale-95 cursor-pointer"
            >
              <Rocket className="h-3.5 w-3.5 fill-black" />
              Build MVP Spec
            </button>
          </div>
        </div>
      </div>

      {/* Founder GPS / AI Execution Engine */}
      <div className="relative mt-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          <Compass className="h-3.5 w-3.5 text-[#deff9a]" />
          Execution GPS & Milestones
        </div>
        <FounderGps
          workspace={workspace}
          tasks={tasks}
          onWorkspaceUpdated={(updated, nextTasks) => {
            setWorkspace(updated);
            if (nextTasks) setTasks(nextTasks);
          }}
        />
      </div>

      {/* Execution Depth Tabs Header */}
      <div id="workspace-tabs-section" className="relative mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            <Layers className="h-3.5 w-3.5 text-[#deff9a]" />
            Startup Execution Modules
          </div>
          <span className="text-xs text-zinc-500">Select a phase to view deliverables</span>
        </div>

        {/* Tab Buttons */}
        <div className="glass-panel flex flex-wrap gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 backdrop-blur-xl">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300",
                  isActive
                    ? "text-black"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="workspace-tab-pill"
                    className="absolute inset-0 rounded-xl bg-[#deff9a] shadow-[0_0_20px_rgba(222,255,154,0.3)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <span>{tab.emoji}</span>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Phase Deliverables View */}
      <div className="relative mt-6 min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="glass-panel rounded-2xl border border-white/[0.08] bg-[#08080c]/90 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl"
          >
            <WorkspacePhasePanels
              workspaceId={workspace.id}
              summary={workspace.summary}
              activeTab={activeTab}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}