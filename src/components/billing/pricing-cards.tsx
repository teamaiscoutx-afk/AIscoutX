"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { PRICING_PLANS, type CatalogPlan } from "@/lib/billing/credit-plans";
import { openRazorpayCheckout } from "@/lib/billing/razorpay";

const GPU = { willChange: "transform, opacity" } as const;
const ease = [0.22, 1, 0.36, 1] as const;

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

async function startPlanCheckout(planId: CatalogPlan["id"]) {
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
    window.location.href = `/login?next=/pricing`;
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
}

function PricingAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-[22%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.18)_0%,transparent_68%)] blur-3xl"
        style={GPU}
        animate={
          reduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], scale: [0.94, 1.06, 0.94] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[8%] top-[48%] h-[380px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.08)_0%,transparent_70%)] blur-3xl"
        style={GPU}
        animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[6%] top-[38%] h-[360px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(51,65,85,0.55)_0%,transparent_72%)] blur-3xl"
        style={GPU}
        animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, 14, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(163,230,53,0.06),transparent_55%)]" />
    </div>
  );
}

function PlanBadge({ label, featured }: { label: string; featured?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={`relative mb-4 inline-flex w-fit overflow-hidden rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
        featured
          ? "border-[#A3E635]/45 bg-[#A3E635]/15 text-[#D9F99D] shadow-[0_0_24px_rgba(163,230,53,0.25)]"
          : "border-[#A3E635]/25 bg-[#A3E635]/10 text-[#D9F99D]"
      }`}
      animate={
        reduceMotion
          ? undefined
          : { boxShadow: ["0 0 16px rgba(163,230,53,0.15)", "0 0 28px rgba(163,230,53,0.35)", "0 0 16px rgba(163,230,53,0.15)"] }
      }
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <span
        aria-hidden
        className="badge-text-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {label}
    </motion.span>
  );
}

function PlanCard({ plan }: { plan: CatalogPlan }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      variants={cardReveal}
      style={GPU}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={
        plan.featured && !reduceMotion
          ? { y: [0, -6, 0] }
          : undefined
      }
      transition={
        plan.featured && !reduceMotion
          ? { y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }
          : undefined
      }
      whileHover={reduceMotion ? undefined : { scale: 1.02, y: plan.featured ? -8 : -4 }}
      className={`relative flex h-full flex-col rounded-3xl ${plan.featured ? "md:-mt-3 md:mb-3" : ""}`}
    >
      {plan.featured && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-[#A3E635]/35 via-[#A3E635]/10 to-transparent opacity-80"
        />
      )}

      <motion.div
        className={`relative z-10 flex h-full flex-col rounded-[22px] border bg-zinc-900/60 p-6 backdrop-blur-xl md:p-7 ${
          plan.featured
            ? "border-[#A3E635]/35 shadow-[0_0_40px_rgba(163,230,53,0.15)]"
            : "border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        }`}
        animate={{
          borderColor: hovered
            ? "rgba(163, 230, 53, 0.5)"
            : plan.featured
              ? "rgba(163, 230, 53, 0.35)"
              : "rgba(255, 255, 255, 0.08)",
          boxShadow: hovered
            ? plan.featured
              ? "0 0 56px rgba(163,230,53,0.28), 0 24px 64px rgba(0,0,0,0.45)"
              : "0 0 40px rgba(163,230,53,0.18), 0 20px 56px rgba(0,0,0,0.4)"
            : plan.featured
              ? "0 0 40px rgba(163,230,53,0.15)"
              : "0 20px 60px rgba(0,0,0,0.35)",
        }}
        transition={{ duration: 0.35, ease }}
      >
        {plan.badge ? <PlanBadge label={plan.badge} featured={plan.featured} /> : null}

        <h2 className="text-lg font-semibold tracking-tight text-white">{plan.name}</h2>

        <p className="mt-5 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.12)] sm:text-[2.75rem]">
            {plan.priceLabel}
          </span>
          <span className="text-sm font-medium text-zinc-500">{plan.period}</span>
        </p>

        <p className="mt-3 text-sm font-semibold text-[#A3E635] drop-shadow-[0_0_16px_rgba(163,230,53,0.35)]">
          {plan.creditsLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{plan.description}</p>

        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A3E635]/15 ring-1 ring-[#A3E635]/30">
                <Check className="h-3.5 w-3.5 text-[#A3E635]" strokeWidth={2.5} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <motion.button
          type="button"
          disabled={pending}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          onClick={() => {
            setPending(true);
            setError(null);
            void startPlanCheckout(plan.id)
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Checkout failed.");
              })
              .finally(() => setPending(false));
          }}
          className={`mt-8 h-12 w-full cursor-pointer rounded-xl text-sm font-bold transition-[background,box-shadow,border-color] duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            plan.featured
              ? "bg-gradient-to-r from-[#A3E635] to-[#84CC16] text-zinc-950 shadow-[0_0_28px_rgba(163,230,53,0.35)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)]"
              : "border border-white/[0.1] bg-white/[0.04] text-white hover:border-lime-400/40 hover:bg-gradient-to-r hover:from-[#A3E635]/20 hover:to-[#84CC16]/10 hover:shadow-[0_0_24px_rgba(163,230,53,0.2)]"
          }`}
        >
          {pending ? "Opening checkout…" : plan.cta}
        </motion.button>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </motion.div>
    </motion.article>
  );
}

type PricingCardsProps = {
  /** Show breathing mesh behind cards (off on homepage section). */
  ambient?: boolean;
  className?: string;
};

export function PricingCards({ ambient = false, className }: PricingCardsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`relative ${className ?? ""}`}>
      {ambient && <PricingAmbient />}
      <motion.div
        className="relative z-10 grid gap-5 md:grid-cols-3 md:gap-6"
        variants={list}
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
      >
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </motion.div>
    </div>
  );
}
