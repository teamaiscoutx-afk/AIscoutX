"use client";

import { CreditMeter } from "@/components/billing/credit-meter";
import { UpgradeToPro } from "@/components/dashboard/upgrade-to-pro";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { useUserMenu } from "@/components/layout/user-menu-provider";

/** Discover dashboard — credits, upgrade, profile only. */
export function DashboardTopbarMinimal() {
  const menu = useUserMenu();
  const plan = menu?.profile?.plan || menu?.user?.user_metadata?.plan;
  const isPro = plan?.toString().toLowerCase() === "pro";

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-end gap-2 border-b border-white/[0.06] bg-[#030308]/80 px-4 backdrop-blur-xl sm:h-14 sm:gap-3 sm:px-6">
      <div className="mr-auto flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A3E635] text-[10px] font-extrabold text-zinc-950">
          AI
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">AIscoutX</span>
      </div>
      <CreditMeter />
      {!isPro && <UpgradeToPro compact />}
      <UserAvatarMenu menu={menu} compact />
    </header>
  );
}
