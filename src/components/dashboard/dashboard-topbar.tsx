"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { NotificationHub } from "@/components/dashboard/notification-hub";
import { UpgradeProModal } from "@/components/dashboard/upgrade-pro-modal";
import { WorkspaceModeToggle } from "@/components/dashboard/workspace-mode-toggle";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { useUserMenu } from "@/components/layout/user-menu-provider";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DashboardTopbarProps = {
  activeWorkspace: WorkspaceIdentity;
  onActiveWorkspaceChange: (workspace: WorkspaceIdentity) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  opportunityOfDayName?: string;
  opportunityOfDayGrowth?: string;
};

function useSearchShortcut(onFocus: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isModK) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        target?.isContentEditable;

      if (isEditable) return;

      e.preventDefault();
      onFocus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onFocus]);
}

export function DashboardTopbar({
  activeWorkspace,
  onActiveWorkspaceChange,
  searchQuery,
  onSearchQueryChange,
  opportunityOfDayName,
  opportunityOfDayGrowth,
}: DashboardTopbarProps) {
  const menu = useUserMenu();
  const searchRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    );
  }, []);

  useSearchShortcut(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  });

  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#030308]/80 px-3 backdrop-blur-xl sm:h-14 sm:gap-3 sm:px-6">
      <div className="relative min-w-0 flex-1 max-w-[140px] xs:max-w-xs sm:max-w-sm md:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
          strokeWidth={1.5}
        />
        <Input
          ref={searchRef}
          type="search"
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          aria-label="Search opportunities"
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          className={cn(
            "h-9 border-white/[0.08] bg-white/[0.03] pl-9 pr-[4.5rem] text-sm text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-[#deff9a]/20"
          )}
        />
        <kbd
          className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500 sm:inline-flex"
          aria-hidden
        >
          {shortcutLabel}
        </kbd>
      </div>

      <div className="min-w-0 flex-1 sm:flex-none">
        <WorkspaceModeToggle
          value={activeWorkspace}
          onChange={onActiveWorkspaceChange}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <UpgradeProModal compact />
        <NotificationHub
          opportunityOfDayName={opportunityOfDayName}
          opportunityOfDayGrowth={opportunityOfDayGrowth}
        />
        <UserAvatarMenu menu={menu} compact />
      </div>
    </header>
  );
}
