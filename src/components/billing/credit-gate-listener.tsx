"use client";

import { useEffect } from "react";

import { OUT_OF_CREDITS_EVENT } from "@/lib/billing/freemium";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";

/** Opens the blocking paywall only when a credit-consuming action fails — not on dashboard load. */
export function CreditGateListener() {
  const { openFreemiumPaywall } = useUpgradeModal();

  useEffect(() => {
    const onOutOfCredits = () => openFreemiumPaywall();
    window.addEventListener(OUT_OF_CREDITS_EVENT, onOutOfCredits);

    return () => {
      window.removeEventListener(OUT_OF_CREDITS_EVENT, onOutOfCredits);
    };
  }, [openFreemiumPaywall]);

  return null;
}
