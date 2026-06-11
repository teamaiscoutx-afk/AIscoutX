"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Layers, Trash2 } from "lucide-react";

import { setWorkspaceActive } from "@/app/actions/notifications";
import { moveWorkspaceToTrash } from "@/app/actions/trash";
import { FounderGps } from "@/components/founder/founder-gps";
import { WorkspacePhasePanels } from "@/components/founder/workspace-phase-panels";
import type { DailyTask, StartupWorkspace } from "@/lib/founder/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", emoji: "📋" },
  { id: "validation", label: "Validation", emoji: "🛡️" },
  { id: "competitors", label: "Competitors", emoji: "⚔️" },
  { id: "mvp", label: "MVP Spec", emoji: "🔧" },
  { id: "launch", label: "Launch Plan", emoji: "📢" },
  { id: "revenue", label: "Revenue Engine", emoji: "💰" },
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

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(222,255,154,0.08),transparent_70%)] blur-3xl"
      />

      <Link
        href="/dashboard/discover"
        className="relative inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#deff9a]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Discover
      </Link>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {watching
            ? "Watching this niche for live pain-point alerts."
            : "Enable watch to get bell notifications when your niche shifts."}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleWorkspaceWatch()}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              watching
                ? "border-[#deff9a]/40 bg-[#deff9a]/10 text-[#deff9a]"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            )}
          >
            {watching ? "Active workspace" : "Mark as active"}
          </button>
          <button
            type="button"
            onClick={handleMoveToBin}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/[0.05] px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Moving…" : "Move to Bin"}
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <FounderGps
          workspace={workspace}
          tasks={tasks}
          onWorkspaceUpdated={(updated, nextTasks) => {
            setWorkspace(updated);
            if (nextTasks) setTasks(nextTasks);
          }}
        />
      </div>

      <div className="relative mt-10">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          <Layers className="h-3.5 w-3.5 text-[#deff9a]/70" />
          Startup workspace depth
        </div>

        <div className="glass-panel flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 backdrop-blur-xl">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-300",
                  isActive
                    ? "text-[#030308]"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="workspace-tab-pill"
                    className="absolute inset-0 rounded-xl bg-[#deff9a] shadow-[0_0_24px_rgba(222,255,154,0.35)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <span>{tab.emoji}</span>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-6 min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="glass-panel rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl sm:p-6"
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
