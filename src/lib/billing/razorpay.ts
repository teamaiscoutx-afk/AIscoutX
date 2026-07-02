"use client";

import {
  PRO_AMOUNT_PAISE,
  PRO_CHECKOUT,
  PRO_CURRENCY,
} from "@/lib/billing/constants";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
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

export function loadRazorpayScript(): Promise<void> {
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

type OpenCheckoutInput = {
  orderId: string;
  prefill?: { email?: string; name?: string };
  onSuccess?: () => void;
  onDismiss?: () => void;
  onError?: (message: string) => void;
};

/** Opens Razorpay Checkout for the Pro subscription order (INR ₹799). */
export async function openRazorpayCheckout(input: OpenCheckoutInput): Promise<void> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is missing from environment.");
  }

  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout failed to initialize.");
  }

  const options: Record<string, unknown> = {
    key: keyId,
    amount: PRO_AMOUNT_PAISE,
    currency: PRO_CURRENCY,
    name: PRO_CHECKOUT.name,
    description: PRO_CHECKOUT.description,
    order_id: input.orderId,
    prefill: input.prefill,
    theme: { color: PRO_CHECKOUT.themeColor },
    handler: async (response: RazorpayHandlerResponse) => {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        if (res.ok) {
          if (input.onSuccess) input.onSuccess();
          else window.location.reload();
          return;
        }

        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Payment verification failed.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Payment verification failed.";
        input.onError?.(message);
      }
    },
    modal: {
      ondismiss: () => input.onDismiss?.(),
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", () => {
    input.onError?.("Payment failed. Please try again or use a different method.");
  });
  rzp.open();
}
