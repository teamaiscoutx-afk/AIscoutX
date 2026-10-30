"use client";

import { PricingPlanGrid } from "@/components/billing/pricing-cards";

export function FreemiumPlanPicker() {
  return (
    <PricingPlanGrid motionTrigger="mount" elevateFeatured={false} />
  );
}
