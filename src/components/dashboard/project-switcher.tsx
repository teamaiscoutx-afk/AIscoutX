"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SidebarProject = {
  id: string;
  name: string;
  isActive: boolean;
};

type ProjectSwitcherProps = {
  projects: SidebarProject[];
  className?: string;
};

/**
 * Sidebar project switcher — toggles between active workspaces and starts
 * fresh ventures via "New Project" (resets context back to Discover).
 */
export function ProjectSwitcher({ projects, className }: ProjectSwitcherProps) {
  const router = useRouter();
  const current = projects.find((p) => p.isActive) ?? projects[0] ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-[#deff9a]/25 hover:bg-white/[0.05]",
            className
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#deff9a]/10">
            <FolderKanban className="h-4 w-4 text-[#deff9a]" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-600">
              Project
            </span>
            <span className="block truncate text-xs font-medium text-white">
              {current ? current.name : "No project yet"}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 border-white/[0.08] bg-[#0a0a12]/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">
          Your ventures
        </DropdownMenuLabel>

        {projects.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-zinc-600">
            Build a startup from an opportunity to start your first project.
          </p>
        )}

        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => router.push(`/dashboard/workspace/${project.id}`)}
            className="cursor-pointer gap-2 text-zinc-300 focus:bg-white/[0.06] focus:text-white"
          >
            <span className="truncate">{project.name}</span>
            {project.isActive && (
              <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#deff9a]" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        <DropdownMenuItem
          onSelect={() => router.push("/dashboard/discover")}
          className="cursor-pointer gap-2 text-[#deff9a] focus:bg-[#deff9a]/10 focus:text-[#deff9a]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
