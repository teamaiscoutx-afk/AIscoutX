"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  FileText,
  Flame,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Intelligence Feed",
    href: "/dashboard",
    icon: LayoutDashboard,
    hash: null,
  },
  {
    label: "Exploding Opportunities",
    href: "/dashboard",
    icon: Flame,
    hash: "opportunities",
  },
  {
    label: "Saved Signals",
    href: "/dashboard",
    icon: Bookmark,
    hash: "saved",
    disabled: true,
  },
  {
    label: "AI Briefings",
    href: "/dashboard",
    icon: FileText,
    hash: "briefings",
    disabled: true,
  },
  {
    label: "Alerts",
    href: "/dashboard",
    icon: Bell,
    hash: "alerts",
    disabled: true,
  },
  {
    label: "Settings",
    href: "/dashboard",
    icon: Settings,
    hash: "settings",
    disabled: true,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/[0.06] bg-[#030308]/95 backdrop-blur-xl lg:w-64 lg:shrink-0">
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4 lg:h-16 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#deff9a]/15 text-sm font-bold text-[#deff9a]">
            AI
          </span>
          <div>
            <span className="font-semibold tracking-tight text-white">
              AIscoutX
            </span>
            <p className="text-[10px] text-zinc-600">Command Center</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 lg:p-4">
        {navItems.map((item) => {
          const href = item.hash ? `${item.href}#${item.hash}` : item.href;
          const isActive =
            pathname === "/dashboard" &&
            (item.hash === null
              ? hash === "" || hash === "#"
              : hash === `#${item.hash}`);

          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : href}
              aria-disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive && !item.disabled
                  ? "border border-[#deff9a]/20 bg-[#deff9a]/10 text-[#deff9a]"
                  : "text-zinc-500 hover:border hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-white",
                item.disabled && "pointer-events-none opacity-40"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{item.label}</span>
              {item.disabled && (
                <span className="ml-auto text-[9px] uppercase tracking-wider text-zinc-600">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-[#deff9a]/20 bg-[#deff9a]/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#deff9a]">
            <Sparkles className="h-3.5 w-3.5" />
            Pro intelligence
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Drawer insights & score breakdowns are live. Full algorithm sync
            coming next.
          </p>
        </div>
      </div>
    </aside>
  );
}
