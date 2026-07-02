"use client";

import { createContext, useContext } from "react";

import type { PlatformNotification } from "@/app/actions/notifications";
import type { SubscriptionRenewalAlert } from "@/lib/billing/subscription-alerts";

type DashboardShellContextValue = {
  notifications: PlatformNotification[];
  renewalAlert: SubscriptionRenewalAlert;
};

const DashboardShellContext = createContext<DashboardShellContextValue>({
  notifications: [],
  renewalAlert: { show: false, message: "", renewalDate: null, daysRemaining: null },
});

export function DashboardShellProvider({
  notifications,
  renewalAlert,
  children,
}: DashboardShellContextValue & { children: React.ReactNode }) {
  return (
    <DashboardShellContext.Provider value={{ notifications, renewalAlert }}>
      {children}
    </DashboardShellContext.Provider>
  );
}

export function useDashboardShell(): DashboardShellContextValue {
  return useContext(DashboardShellContext);
}
