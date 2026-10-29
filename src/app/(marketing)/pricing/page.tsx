import type { Metadata } from "next";

import { PricingCards } from "@/components/billing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing — AIscoutX",
  description: "Monthly, 6-month, and founding member plans. 200 credits refresh every month.",
};

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3E635]">Pricing</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Credits that refresh every month
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
          Every plan includes 200 credits per month. Longer plans bank the full run of credits up front and refresh the monthly allowance automatically.
        </p>
      </div>
      <div className="mt-12">
        <PricingCards />
      </div>
    </section>
  );
}
