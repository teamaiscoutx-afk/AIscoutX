"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  getNichesForIdentity,
  type NicheId,
  type WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import { cn } from "@/lib/utils";

type NicheSwitcherProps = {
  activeWorkspace: WorkspaceIdentity;
  activeNiche: NicheId;
  activeNicheLabel: string;
  onNicheChange: (nicheId: NicheId, label: string) => void;
};

export function NicheSwitcher({
  activeWorkspace,
  activeNiche,
  activeNicheLabel,
  onNicheChange,
}: NicheSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const niches = getNichesForIdentity(activeWorkspace);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [activeWorkspace]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Niche: ${activeNicheLabel}. Change niche`}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-200",
          open
            ? "border-[#deff9a]/40 bg-[#deff9a]/15 text-[#deff9a]"
            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-[#deff9a]/25 hover:text-white"
        )}
      >
        {activeNicheLabel}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select niche"
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a12]/95 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          {niches.map((niche) => {
            const selected = niche.id === activeNiche;
            return (
              <li key={niche.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onNicheChange(niche.id, niche.label);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full cursor-pointer px-3 py-2 text-left text-xs transition-colors",
                    selected
                      ? "bg-[#deff9a]/10 text-[#deff9a]"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  {niche.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
