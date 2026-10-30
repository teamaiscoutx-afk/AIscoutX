"use client";

export type CheckoutOrderResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  description?: string;
  prefill?: { email?: string; name?: string };
};

const CHECKOUT_ROUTES = [
  "/api/payments/razorpay-checkout",
  "/api/razorpay/create-order",
] as const;

/**
 * Creates a Razorpay order via the server API (tries canonical + alias routes).
 */
export async function requestCheckoutOrder(plan: string): Promise<CheckoutOrderResponse> {
  let lastError = "Could not start checkout.";
  let lastStatus = 500;

  for (const route of CHECKOUT_ROUTES) {
    const response = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan }),
    });

    const data = (await response.json()) as CheckoutOrderResponse;
    lastStatus = response.status;
    lastError = data.error ?? lastError;

    if (response.status === 401 || data.code === "AUTH_REQUIRED") {
      return data;
    }

    if (response.ok && data.success && data.orderId) {
      return data;
    }
  }

  return {
    success: false,
    error: lastError,
    ...(lastStatus === 401 ? { code: "AUTH_REQUIRED" as const } : {}),
  };
}
