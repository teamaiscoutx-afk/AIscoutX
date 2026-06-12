"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { AccountSettingsDialog } from "@/components/account/account-settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserMenuContext } from "@/lib/auth/user-menu";
import { cn } from "@/lib/utils";

type UserAvatarMenuProps = {
  menu: UserMenuContext;
  compact?: boolean;
};

export function UserAvatarMenu({ menu, compact = false }: UserAvatarMenuProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!menu.isAuthenticated) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-white/10 bg-white/[0.02] text-zinc-300 backdrop-blur-sm hover:border-[#deff9a]/25 hover:bg-white/[0.05] hover:text-white"
        asChild
      >
        <Link href="/login?mode=signup">Get Started</Link>
      </Button>
    );
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1 pr-2 text-left transition-all duration-300 hover:border-[#deff9a]/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(222,255,154,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#deff9a]/30",
              compact && "pr-1"
            )}
            aria-label="Open account menu"
          >
            <Avatar className="h-8 w-8 ring-2 ring-transparent transition-all group-hover:ring-[#deff9a]/40">
              {menu.avatarUrl && (
                <AvatarImage src={menu.avatarUrl} alt={menu.name} />
              )}
              <AvatarFallback className="text-xs">{menu.initials}</AvatarFallback>
            </Avatar>
            {!compact && (
              <>
                <span className="hidden max-w-[120px] truncate text-xs font-medium text-zinc-300 sm:block">
                  {menu.name}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 sm:block" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-2">
          <DropdownMenuLabel className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 font-normal">
            <p className="text-sm font-semibold text-white">{menu.name}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{menu.email}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#deff9a]/80">
              <Sparkles className="h-3 w-3" />
              Founder Memory
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {menu.persona && (
                <Badge
                  variant="outline"
                  className="border-[#deff9a]/25 bg-[#deff9a]/10 text-[10px] text-[#deff9a]"
                >
                  Persona: {menu.persona}
                </Badge>
              )}
              {menu.goal && (
                <Badge
                  variant="outline"
                  className="border-violet-500/25 bg-violet-500/10 text-[10px] text-violet-300"
                >
                  Goal: {menu.goal}
                </Badge>
              )}
              {menu.nicheFocus && (
                <Badge
                  variant="outline"
                  className="border-cyan-500/25 bg-cyan-500/10 text-[10px] text-cyan-300"
                >
                  Niche: {menu.nicheFocus}
                </Badge>
              )}
              {!menu.persona && !menu.goal && !menu.nicheFocus && (
                <span className="text-[11px] text-zinc-500">
                  Complete onboarding to unlock founder context.
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-white/[0.06] bg-gradient-to-br from-[#deff9a]/[0.06] to-transparent p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <Rocket className="h-3 w-3 text-[#deff9a]" />
              Venture Engine
            </p>
            <p className="mt-1.5 text-sm font-medium text-white">
              Active: {menu.activeVenture}
            </p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/discover"
              className="cursor-pointer gap-2 text-zinc-300 focus:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-zinc-300 focus:text-white"
            onSelect={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
            disabled={isPending}
            onSelect={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Signing out…" : "Log Out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
