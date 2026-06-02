"use client";

import { Bell, Search } from "lucide-react";

import { WorkspaceModeToggle } from "@/components/dashboard/workspace-mode-toggle";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { Input } from "@/components/ui/input";

type DashboardTopbarProps = {
  activeWorkspace: WorkspaceIdentity;
  onActiveWorkspaceChange: (workspace: WorkspaceIdentity) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export function DashboardTopbar({
  activeWorkspace,
  onActiveWorkspaceChange,
  searchQuery,
  onSearchQueryChange,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#030308]/80 px-3 backdrop-blur-xl sm:h-14 sm:gap-3 sm:px-6">
      <div className="relative min-w-0 flex-1 max-w-[140px] xs:max-w-xs sm:max-w-sm md:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          aria-label="Search opportunities"
          className="h-9 border-white/[0.08] bg-white/[0.03] pl-9 text-sm text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-[#deff9a]/20"
        />
      </div>

      <div className="min-w-0 flex-1 sm:flex-none">
        <WorkspaceModeToggle
          value={activeWorkspace}
          onChange={onActiveWorkspaceChange}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-white"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#deff9a]" />
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-zinc-300"
          title="User"
        >
          K
        </div>
      </div>
    </header>
  );
}
