"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { PRICING_PLANS } from "@/lib/billing/credit-plans";
import { openRazorpayCheckout } from "@/lib/billing/razorpay";

export function FreemiumPlanPicker() {
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planId: string) {
    setPendingPlan(planId);
    setError(null);
    try {
      const response = await fetch("/api/payments/razorpay-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        description?: string;
        prefill?: { email?: string; name?: string };
      };

      if (response.status === 401 || data.code === "AUTH_REQUIRED") {
        window.location.href = "/login?next=/pricing";
        return;
      }
      if (!response.ok || !data.success || !data.orderId) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      await openRazorpayCheckout({
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        prefill: data.prefill,
        onSuccess: () => {
          window.location.href = "/dashboard/workspace";
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="space-y-3">
      {PRICING_PLANS.map((plan) => (
        <button
          key={plan.id}
          type="button"
          disabled={Boolean(pendingPlan)}
          onClick={() => void checkout(plan.id)}
          className={`flex w-full flex-col rounded-2xl border p-4 text-left transition ${
            plan.featured
              ? "border-[#A3E635]/40 bg-[#A3E635]/10 shadow-[0_0_32px_rgba(163,230,53,0.12)]"
              : "border-white/[0.08] bg-zinc-900/50 hover:border-[#A3E635]/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">{plan.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{plan.creditsLabel}</p>
            </div>
            <p className="text-lg font-extrabold text-[#A3E635]">
              {plan.priceLabel}
              <span className="text-xs font-medium text-zinc-500">{plan.period}</span>
            </p>
          </div>
          <ul className="mt-3 space-y-1.5">
            {plan.features.slice(0, 2).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-xs text-zinc-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A3E635]" />
                {feature}
              </li>
            ))}
          </ul>
          <span className="mt-3 text-xs font-bold text-[#D9F99D]">
            {pendingPlan === plan.id ? "Opening checkout…" : plan.cta}
          </span>
        </button>
      ))}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
