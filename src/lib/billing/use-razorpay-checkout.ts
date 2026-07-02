"use client";

import { useCallback, useState } from "react";

import { openRazorpayCheckout } from "@/lib/billing/razorpay";

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "pro" }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        orderId?: string;
        prefill?: { email?: string; name?: string };
      };

      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        window.location.href = "/login?next=/dashboard/discover";
        return;
      }

      if (!res.ok || !data.success || !data.orderId) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        prefill: data.prefill,
        onSuccess: () => window.location.reload(),
        onDismiss: () => setLoading(false),
        onError: (message) => {
          setLoading(false);
          setError(message);
        },
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }, []);

  return {
    startCheckout,
    loading,
    error,
    clearError: () => setError(null),
  };
}
