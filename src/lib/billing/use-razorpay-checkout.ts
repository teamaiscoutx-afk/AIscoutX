"use client";

import { useCallback, useState } from "react";

// --- Razorpay Helper Types ---
type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

// --- Helper function to build options ---
export function buildRazorpayOptions(
  session: any,
  onSuccess: () => void,
  onDismiss: () => void,
  onError: (message: string) => void
): Record<string, any> {
  return {
    key: session.keyId,
    name: session.name,
    description: session.description,
    prefill: session.prefill,
    notes: session.notes,
    theme: { color: "#deff9a" },
    modal: { ondismiss: onDismiss },
    handler: async (response: RazorpayHandlerResponse) => {
      try {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.ok) {
          throw new Error(verifyData.error ?? "Payment verification failed.");
        }
        onSuccess();
      } catch (err: any) {
        onError(err.message ?? "Payment verification failed.");
      }
    },
    order_id: session.orderId,
    amount: 189900,
    currency: "INR",
  };
}

// --- Main Hook ---
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
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.checkout) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      // Load Razorpay Script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const rzp = new (window as any).Razorpay(
          buildRazorpayOptions(
            data.checkout,
            () => { setLoading(false); window.location.href = "/dashboard/discover?billing=success"; },
            () => { setLoading(false); },
            (msg: string) => { setLoading(false); setError(msg); }
          )
        );
        rzp.open();
      };
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      alert("Error: " + err.message); // Temporary alert for debugging
    }
  }, []);

  return { startCheckout, loading, error };
}