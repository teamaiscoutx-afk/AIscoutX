"use client";

import { usePathname } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

type DashboardChromeProps = {
  projects: { id: string; name: string; isActive: boolean }[];
  children: React.ReactNode;
};

export function DashboardChrome({ projects, children }: DashboardChromeProps) {
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith("/dashboard/discover");

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
      {!hideSidebar && <DashboardSidebar projects={projects} />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
