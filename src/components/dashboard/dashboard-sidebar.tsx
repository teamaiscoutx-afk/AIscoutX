"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Hammer,
  LineChart,
  Megaphone,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Discover", href: "/dashboard/discover", icon: Search },
  { label: "Validate", href: "/dashboard/validate", icon: ShieldCheck },
  { label: "Build", href: "/dashboard/build", icon: Hammer },
  { label: "Launch", href: "/dashboard/launch", icon: Megaphone },
  { label: "Grow", href: "/dashboard/grow", icon: LineChart },
  { label: "AI Mentor Chat", href: "/dashboard/mentor", icon: Bot },
];

export function DashboardSidebar() {
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

      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#deff9a]">
            <Rocket className="h-3.5 w-3.5" />
            Founder GPS active
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Build startups from idea to first revenue with guided execution.
          </p>
          <Link
            href="/dashboard/discover"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#deff9a]"
          >
            <Sparkles className="h-3 w-3" />
            Open workspace
          </Link>
        </div>
      </div>
    </aside>
  );
}
