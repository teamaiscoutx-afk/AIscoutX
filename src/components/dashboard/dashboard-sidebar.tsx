"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileStack,
  LineChart,
  Map,
  Megaphone,
  Navigation,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { FounderWatchtower } from "@/components/dashboard/founder-watchtower";
import {
  ProjectSwitcher,
  type SidebarProject,
} from "@/components/dashboard/project-switcher";
import {
  UpgradeToPro,
  UpgradeToProCta,
} from "@/components/dashboard/upgrade-to-pro";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { useUserMenu } from "@/components/layout/user-menu-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Discover", href: "/dashboard/discover", icon: Search },
  { label: "Analyze", href: "/dashboard/analyze", icon: LineChart },
  { label: "Blueprints", href: "/dashboard/blueprints", icon: FileStack },
  { label: "Launch Plan", href: "/dashboard/launch", icon: Megaphone },
  { label: "Founder GPS", href: "/dashboard/gps", icon: Navigation },
  { label: "AI Founder Chat", href: "/dashboard/chat", icon: Bot },
  { label: "Trash / Bin", href: "/dashboard/trash", icon: Trash2 },
];

type DashboardSidebarProps = {
  projects?: SidebarProject[];
};

export function DashboardSidebar({ projects = [] }: DashboardSidebarProps) {
  const menu = useUserMenu();
  const pathname = usePathname();

  // 🎯 CRITICAL FIX: Check if user is on Pro Plan
  const plan = menu?.profile?.plan || menu?.user?.user_metadata?.plan;
  const isPro = plan?.toString().toLowerCase() === "pro";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-[#030308]/95 backdrop-blur-xl lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:sticky lg:top-0">
      {/* Brand row — on mobile also hosts Upgrade + bell + avatar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 lg:h-16 lg:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#deff9a]/15 text-sm font-bold text-[#deff9a]">
            AI
          </span>
          <div className="min-w-0">
            <span className="block truncate font-semibold tracking-tight text-white">
              AIscoutX
            </span>
            <p className="text-[10px] text-zinc-600">Founder OS</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {/* Hide Upgrade Button if Pro */}
          {!isPro && <UpgradeToPro compact />}
          <FounderWatchtower />
          <UserAvatarMenu menu={menu} compact />
        </div>
      </div>

      {/* Project switcher + New Project */}
      <div className="shrink-0 px-2 pt-2 lg:px-4 lg:pt-4">
        <ProjectSwitcher projects={projects} />
      </div>

      {/* Nav — horizontal scroll strip on mobile, vertical list on desktop */}
      <nav
        className={cn(
          "flex gap-1 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:flex-1 lg:flex-col lg:gap-0 lg:space-y-0.5 lg:overflow-y-auto lg:overflow-x-visible lg:p-4"
        )}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 lg:gap-3 lg:py-2.5 lg:text-sm",
                isActive
                  ? "border border-[#deff9a]/20 bg-[#deff9a]/10 text-[#deff9a]"
                  : "border border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop footer — premium Upgrade CTA above account + pitch card */}
      <div className="hidden shrink-0 space-y-3 border-t border-white/[0.06] p-4 lg:block">
        {/* Hide Upgrade CTA if Pro */}
        {!isPro && <UpgradeToProCta />}

        <div className="flex justify-center">
          <UserAvatarMenu menu={menu} />
        </div>

        <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#deff9a]">
            <Map className="h-3.5 w-3.5" />
            Idea → Blueprint in 10 min
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Discover signals, analyze markets, ship blueprints, and launch with
            GPS tracking.
          </p>
          <Link
            href="/dashboard/gps"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#deff9a]"
          >
            <Sparkles className="h-3 w-3" />
            Open Founder GPS
          </Link>
        </div>
      </div>
    </aside>
  );
}