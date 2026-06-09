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
} from "lucide-react";

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
];

export function DashboardSidebar() {
  const menu = useUserMenu();
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/[0.06] bg-[#030308]/95 backdrop-blur-xl lg:w-64 lg:shrink-0">
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4 lg:h-16 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#deff9a]/15 text-sm font-bold text-[#deff9a]">
            AI
          </span>
          <div>
            <span className="font-semibold tracking-tight text-white">AIscoutX</span>
            <p className="text-[10px] text-zinc-600">Founder OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 lg:p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border border-[#deff9a]/20 bg-[#deff9a]/10 text-[#deff9a]"
                  : "text-zinc-500 hover:border hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-4 space-y-3">
        <div className="hidden lg:flex lg:justify-center">
          <UserAvatarMenu menu={menu} />
        </div>
        <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#deff9a]">
            <Map className="h-3.5 w-3.5" />
            Idea → Blueprint in 10 min
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Discover signals, analyze markets, ship blueprints, and launch with GPS
            tracking.
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
