"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";

import { dismissRenewalAlert } from "@/app/actions/subscription-alerts";
import { useDashboardShell } from "@/components/dashboard/dashboard-shell-provider";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";

export function SubscriptionRenewalBanner() {
  const { renewalAlert } = useDashboardShell();
  const { openUpgradeModal } = useUpgradeModal();
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!renewalAlert.show || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    startTransition(async () => {
      await dismissRenewalAlert();
    });
  }

  return (
    <div
      role="status"
      className="relative z-20 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-100">Plan renewal coming up</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">
            {renewalAlert.message}
          </p>
          <button
            type="button"
            onClick={() => openUpgradeModal("Renew your Pro plan to keep full access.")}
            className="mt-2 text-xs font-semibold text-[#00FF66] hover:underline"
          >
            Review payment options
          </button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Dismiss renewal reminder"
          className="shrink-0 rounded-md p-1 text-amber-300/70 transition-colors hover:bg-white/5 hover:text-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
