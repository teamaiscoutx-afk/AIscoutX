import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getNicheLabel } from "@/lib/dashboard/onboarding";

const WORKSPACE_CONTEXT: Record<WorkspaceIdentity, string> = {
  founder: "startup founder building a venture",
  creator: "content creator growing an audience",
  agency: "service agency winning clients",
  solopreneur: "solopreneur building digital income",
};

const NICHE_QUERY_MAP: Record<NicheId, string[]> = {
  "b2b-saas": [
    "B2B workflow automation SaaS startup opportunity",
    "AI sales enablement tool complaints reddit",
  ],
  "ai-tools": [
    "AI developer tools startup opportunity",
    "AI agent builder platform market gap",
  ],
  ecommerce: [
    "ecommerce automation AI startup",
    "DTC retention software pain points",
  ],
  "tech-ai": [
    "AI startup opportunity 2025",
    "vertical AI agent creator economy",
  ],
  "finance-business": [
    "fintech creator tool opportunity",
    "personal finance automation SaaS",
  ],
  lifestyle: [
    "lifestyle creator monetization tool",
    "wellness subscription startup opportunity",
  ],
  "coding-design": [
    "developer productivity tool opportunity",
    "design workflow automation SaaS",
  ],
  "marketing-services": [
    "marketing agency automation software",
    "client reporting AI tool opportunity",
  ],
  "ai-implementation": [
    "AI implementation agency service opportunity",
    "enterprise AI consulting automation",
  ],
  "growth-ops": [
    "growth ops automation SaaS",
    "revops tooling startup opportunity",
  ],
  "digital-products": [
    "digital product launch tool solopreneur",
    "course creator software opportunity",
  ],
  "freelance-ai": [
    "freelance AI services productized offer",
    "AI consulting solo founder SaaS",
  ],
  "side-hustles": [
    "side hustle automation tool opportunity",
    "micro SaaS indie hacker niche 2025",
  ],
};

/**
 * Build Tavily/OpenAI seed queries from the user's active workspace + niche.
 * Always leads with the human-readable niche label for relevance.
 */
export function resolveDiscoverySeeds(
  workspace: WorkspaceIdentity,
  niche: NicheId,
  extraTokens: string[] = []
): string[] {
  const label = getNicheLabel(workspace, niche);
  const persona = WORKSPACE_CONTEXT[workspace];
  const mapped = NICHE_QUERY_MAP[niche] ?? [
    `${label} ${persona} startup opportunity`,
    `${label} pain points reddit ${persona}`,
  ];

  const seeds = [
    `${label} opportunities for ${persona} 2025`,
    ...mapped.map((query) => `${query} ${persona}`),
    ...extraTokens,
  ];

  return Array.from(new Set(seeds.map((s) => s.trim()).filter(Boolean))).slice(0, 4);
}
