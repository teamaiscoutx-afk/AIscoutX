import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getNicheLabel } from "@/lib/dashboard/onboarding";

const NICHE_QUERY_MAP: Record<string, string[]> = {
  "b2b-saas": ["B2B workflow automation SaaS", "AI sales enablement tool"],
  "ai-tools": ["AI developer tools startup", "AI agent builder platform"],
  ecommerce: ["ecommerce automation AI", "DTC retention software"],
  "content-creation": ["creator monetization tool", "AI content workflow"],
  "personal-brand": ["personal brand automation", "creator CRM software"],
  "tech-ai": ["AI startup opportunity 2025", "vertical AI agent"],
  "local-services": ["AI receptionist local business", "appointment booking automation"],
  "service-business": ["agency automation software", "client reporting AI"],
  "productized-services": ["productized service SaaS", "done-for-you automation"],
  "info-products": ["digital product launch tool", "course creator software"],
};

export function resolveDiscoverySeeds(
  workspace: WorkspaceIdentity,
  niche: NicheId,
  extraTokens: string[] = []
): string[] {
  const label = getNicheLabel(workspace, niche);
  const mapped = NICHE_QUERY_MAP[niche] ?? [label];
  const seeds = [label, ...mapped, ...extraTokens];

  return Array.from(new Set(seeds.map((s) => s.trim()).filter(Boolean))).slice(0, 5);
}
