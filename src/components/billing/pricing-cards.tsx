"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { PRICING_PLANS, type CatalogPlan } from "@/lib/billing/credit-plans";
import { openRazorpayCheckout } from "@/lib/billing/razorpay";

async function startPlanCheckout(planId: CatalogPlan["id"]) {
  const response = await fetch("/api/checkout", {
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
    description?: string;
    prefill?: { email?: string; name?: string };
  };

  if (response.status === 401 || data.code === "AUTH_REQUIRED") {
    window.location.href = `/login?next=/pricing`;
    return;
  }
  if (!response.ok || !data.success || !data.orderId) {
    throw new Error(data.error ?? "Could not start checkout.");
  }

  await openRazorpayCheckout({
    orderId: data.orderId,
    amount: data.amount,
    description: data.description,
    prefill: data.prefill,
    onSuccess: () => {
      window.location.href = "/dashboard/workspace";
    },
  });
}

function PlanCard({ plan }: { plan: CatalogPlan }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
      className={`relative flex h-full flex-col rounded-3xl border p-6 backdrop-blur-xl ${
        plan.featured
          ? "border-[#A3E635]/40 bg-zinc-900/80 shadow-[0_0_48px_rgba(163,230,53,0.16)]"
          : "border-white/[0.08] bg-zinc-950/70"
      }`}
      style={{ willChange: "transform" }}
    >
      {plan.badge && (
        <p className="mb-4 inline-flex w-fit rounded-full border border-[#A3E635]/30 bg-[#A3E635]/10 px-3 py-1 text-[11px] font-bold text-[#D9F99D]">
          {plan.badge}
        </p>
      )}
      <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-white">{plan.priceLabel}</span>
        <span className="text-sm text-zinc-500">{plan.period}</span>
      </p>
      <p className="mt-2 text-sm font-medium text-[#A3E635]">{plan.creditsLabel}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{plan.description}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A3E635]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError(null);
          void startPlanCheckout(plan.id)
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Checkout failed.");
            })
            .finally(() => setPending(false));
        }}
        className={`mt-8 h-11 w-full cursor-pointer rounded-xl text-sm font-bold transition ${
          plan.featured
            ? "bg-[#A3E635] text-zinc-950 hover:bg-[#84CC16]"
            : "border border-white/[0.08] bg-white/[0.04] text-white hover:border-[#A3E635]/40"
        }`}
      >
        {pending ? "Opening checkout…" : plan.cta}
      </button>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </motion.article>
  );
}

export function PricingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
