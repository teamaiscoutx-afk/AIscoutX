import type { Metadata } from "next";

import { fetchNotifications } from "@/app/actions/notifications";
import { getSubscriptionRenewalAlert } from "@/app/actions/subscription-alerts";
import { getUserWorkspaces } from "@/app/actions/workspaces";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { DashboardShellProvider } from "@/components/dashboard/dashboard-shell-provider";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SubscriptionRenewalBanner } from "@/components/dashboard/subscription-renewal-banner";
import { UserMenuProvider } from "@/components/layout/user-menu-provider";
import { getUserMenuContext } from "@/lib/auth/user-menu";
import { syncActiveWorkspaceSignals } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — AIscoutX",
  description: "Your AI Founder Operating System.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let menu = await getUserMenuContext().catch(() => ({
    isAuthenticated: false,
    name: "Guest",
    email: "",
    initials: "G",
    avatarUrl: null,
    persona: null,
    goal: null,
    nicheFocus: null,
    activeVenture: "Exploring Opportunities",
  }));

  let workspaces: Awaited<ReturnType<typeof getUserWorkspaces>> = [];
  let notifications: Awaited<ReturnType<typeof fetchNotifications>> = [];
  let renewalAlert: Awaited<ReturnType<typeof getSubscriptionRenewalAlert>> = {
    show: false,
    message: "",
    renewalDate: null,
    daysRemaining: null,
  };

  try {
    [menu, workspaces, notifications, renewalAlert] = await Promise.all([
      getUserMenuContext(),
      getUserWorkspaces(),
      fetchNotifications(),
      getSubscriptionRenewalAlert(),
    ]);

    void syncActiveWorkspaceSignals().catch(() => undefined);
  } catch {
    // Never block the dashboard shell on a partial data failure.
  }

  const projects = workspaces.map((w) => ({
    id: w.id,
    name: w.opportunityName,
    isActive: w.isActive,
  }));

  return (
    <UserMenuProvider value={menu}>
      <UpgradeModalProvider>
        <DashboardShellProvider
          notifications={notifications}
          renewalAlert={renewalAlert}
        >
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
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <SubscriptionRenewalBanner />
                {children}
              </div>
            </div>
          </div>
        </DashboardShellProvider>
      </UpgradeModalProvider>
    </UserMenuProvider>
  );
}
