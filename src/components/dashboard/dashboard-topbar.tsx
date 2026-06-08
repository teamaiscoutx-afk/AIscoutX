"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  onSearchSubmit: (query: string) => void;
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
  onSearchSubmit,
  opportunityOfDayName,
  opportunityOfDayGrowth,
}: DashboardTopbarProps) {
  const menu = useUserMenu();
  const searchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    );
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  useSearchShortcut(focusSearch);

  const applySearch = useCallback(
    (value: string) => {
      const normalized = value.trim();
      setDraftQuery(value);
      onSearchSubmit(normalized);
    },
    [onSearchSubmit]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setDraftQuery(value);
      onSearchQueryChange(value);
    },
    [onSearchQueryChange]
  );

  const handleSubmit = useCallback(() => {
    applySearch(draftQuery);
    searchRef.current?.focus();
  }, [applySearch, draftQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applySearch(draftQuery);
      }
    },
    [applySearch, draftQuery]
  );

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
          type="text"
          role="searchbox"
          placeholder="Search opportunities..."
          value={draftQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search opportunities"
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          className={cn(
            "h-9 border-white/[0.08] bg-white/[0.03] pl-9 pr-[3.25rem] text-sm text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-[#deff9a]/20 sm:pr-[6.75rem]"
          )}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <kbd
            className="pointer-events-none hidden items-center rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500 sm:inline-flex"
            aria-hidden
          >
            {shortcutLabel}
          </kbd>
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Search opportunities"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.05] text-zinc-400 backdrop-blur-md transition-all duration-200 hover:border-[#deff9a]/30 hover:bg-[#deff9a]/10 hover:text-[#deff9a] hover:shadow-[0_0_12px_rgba(222,255,154,0.15)]"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
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
