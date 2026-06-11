import type { Metadata } from "next";

import { getUserWorkspaces } from "@/app/actions/workspaces";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { UserMenuProvider } from "@/components/layout/user-menu-provider";
import { getUserMenuContext } from "@/lib/auth/user-menu";

export const metadata: Metadata = {
  title: "Dashboard — AIscoutX",
  description: "Your AI Founder Operating System.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, workspaces] = await Promise.all([
    getUserMenuContext(),
    getUserWorkspaces(),
  ]);
  const projects = workspaces.map((w) => ({
    id: w.id,
    name: w.opportunityName,
    isActive: w.isActive,
  }));

  return (
    <UserMenuProvider value={menu}>
      <UpgradeModalProvider>
      <div className="flex min-h-screen bg-[#030308] text-foreground">
        <div
          aria-hidden
          className="bg-grid-mesh pointer-events-none fixed inset-0 opacity-40"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(67,56,202,0.12),transparent_50%)]"
        />

        <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
          <DashboardSidebar projects={projects} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
      </UpgradeModalProvider>
    </UserMenuProvider>
  );
}
