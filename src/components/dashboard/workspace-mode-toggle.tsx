"use client";

import { motion } from "framer-motion";

import {
  IDENTITY_OPTIONS,
  type WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import { cn } from "@/lib/utils";

type WorkspaceModeToggleProps = {
  value: WorkspaceIdentity;
  onChange: (workspace: WorkspaceIdentity) => void;
  showLabel?: boolean;
};

export function WorkspaceModeToggle({
  value,
  onChange,
  showLabel = true,
}: WorkspaceModeToggleProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      {showLabel && (
        <span className="hidden text-[10px] font-medium uppercase tracking-wider text-zinc-600 md:inline">
          Workspace
        </span>
      )}
      <div
        role="tablist"
        aria-label="Workspace mode"
        className="flex shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5"
      >
        {IDENTITY_OPTIONS.map((mode) => {
          const isActive = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(mode.id)}
              title={mode.description}
              className={cn(
                "relative rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors duration-200 sm:px-2.5 sm:text-xs",
                isActive ? "text-black" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="workspace-mode-pill"
                  className="absolute inset-0 rounded-md bg-[#deff9a] shadow-[0_0_16px_rgba(222,255,154,0.25)]"
                  transition={{ type: "spring", damping: 28, stiffness: 360 }}
                />
              )}
              <span className="relative z-10">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
