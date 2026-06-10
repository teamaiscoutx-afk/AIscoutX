import type { Metadata } from "next";

import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { UserMenuProvider } from "@/components/layout/user-menu-provider";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
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
  const menu = await getUserMenuContext();

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
          <DashboardSidebar />
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-end border-b border-white/[0.06] bg-[#030308]/60 px-4 py-2 backdrop-blur-xl lg:hidden">
              <UserAvatarMenu menu={menu} compact />
            </div>
            {children}
          </div>
        </div>
      </div>
      </UpgradeModalProvider>
    </UserMenuProvider>
  );
}
