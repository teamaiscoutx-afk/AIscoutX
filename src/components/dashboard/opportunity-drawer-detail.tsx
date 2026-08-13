"use client";

import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";

type OpportunityDrawerDetailProps = {
  opportunity?: Opportunity | null;
  activeWorkspace?: WorkspaceIdentity;
};

export function OpportunityDrawerDetail({}: OpportunityDrawerDetailProps) {
  // Permanently disabled & safe: Isse popup bilkul bhi render nahi hoga
  return null;
}