import type { Metadata } from "next";

import { PricingCards } from "@/components/billing/pricing-cards";
import { PricingPageHero } from "@/components/billing/pricing-page-hero";

export const metadata: Metadata = {
  title: "Pricing — AIscoutX",
  description: "Monthly, 6-month, and founding member plans. 200 credits refresh every month.",
};

export default function PricingPage() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#09090B] py-16 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <PricingPageHero />
        <div className="relative mt-12 min-h-[420px]">
          <PricingCards ambient />
        </div>
      </div>
    </section>
  );
}
