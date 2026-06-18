"use client";

import { useCallback, useState } from "react";

import type { RazorpayCheckoutSession } from "@/lib/billing/razorpay";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: () => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay runs in the browser only."));
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function buildRazorpayOptions(
  session: RazorpayCheckoutSession,
  onSuccess: () => void,
  onDismiss: () => void,
  onError: (message: string) => void
): Record<string, unknown> {
  const base = {
    key: session.keyId,
    name: session.name,
    description: session.description,
    prefill: session.prefill,
    notes: session.notes,
    theme: { color: "#deff9a" },
    modal: {
      ondismiss: onDismiss,
    },
    handler: async (response: RazorpayHandlerResponse) => {
      try {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(response),
        });
        const verifyData = (await verifyRes.json()) as {
          ok?: boolean;
          error?: string;
        };
        if (!verifyRes.ok || !verifyData.ok) {
          throw new Error(verifyData.error ?? "Payment verification failed.");
        }
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Payment verification failed.");
      }
    },
  };

  if (session.mode === "subscription" && session.subscriptionId) {
    return {
      ...base,
      subscription_id: session.subscriptionId,
    };
  }

  return {
    ...base,
    order_id: session.orderId,
    amount: session.amount,
    currency: session.currency,
  };
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (plan: "pro" = "pro") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        checkout?: RazorpayCheckoutSession;
      };

      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        window.location.href = "/login?next=/dashboard/discover";
        return;
      }

      if (!res.ok || !data.ok || !data.checkout) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to initialize.");
      }

      const checkout = data.checkout;
      const rzp = new window.Razorpay(
        buildRazorpayOptions(
          checkout,
          () => {
            setLoading(false);
            window.location.href = "/dashboard/discover?billing=success";
          },
          () => {
            setLoading(false);
          },
          (message) => {
            setLoading(false);
            setError(message);
          }
        )
      );

      rzp.on("payment.failed", () => {
        setLoading(false);
        setError("Payment failed. Please try again or use a different method.");
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }, []);

  return { startCheckout, loading, error, clearError: () => setError(null) };
}
