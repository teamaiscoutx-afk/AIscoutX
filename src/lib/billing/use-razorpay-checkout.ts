"use client";

import { useCallback, useState } from "react";

import { openRazorpayCheckout } from "@/lib/billing/razorpay";
import { requestCheckoutOrder } from "@/lib/billing/request-checkout-order";

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestCheckoutOrder("monthly");

      if (data.code === "AUTH_REQUIRED") {
        window.location.href = "/login?next=/dashboard/discover";
        return;
      }

      if (!data.success || !data.orderId) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
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
