import type { Metadata } from "next";

import { fetchNotifications } from "@/app/actions/notifications";
import { getSubscriptionRenewalAlert } from "@/app/actions/subscription-alerts";
import { getUserWorkspaces } from "@/app/actions/workspaces";
import { CreditGateListener } from "@/components/billing/credit-gate-listener";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal";
import { DashboardShellProvider } from "@/components/dashboard/dashboard-shell-provider";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { SubscriptionRenewalBanner } from "@/components/dashboard/subscription-renewal-banner";
import { UserMenuProvider } from "@/components/layout/user-menu-provider";
import { getUserMenuContext } from "@/lib/auth/user-menu";

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
        <CreditGateListener />
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

            <DashboardChrome projects={projects}>
              <SubscriptionRenewalBanner />
              {children}
            </DashboardChrome>
          </div>
        </DashboardShellProvider>
      </UpgradeModalProvider>
    </UserMenuProvider>
  );
}