"use client";
import { useCallback, useState } from "react";

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
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed");
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const rzp = new (window as any).Razorpay({
          ...data.checkout,
          amount: 189900,
          currency: "INR",
          handler: async (response: any) => {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if ((await verifyRes.json()).ok) window.location.href = "/dashboard/discover?billing=success";
            else setError("Verification failed");
          }
        });
        rzp.open();
        setLoading(false);
      };
      document.body.appendChild(script);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { startCheckout, loading, error };
}
