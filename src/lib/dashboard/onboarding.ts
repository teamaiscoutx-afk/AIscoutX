import type { WorkspaceMode } from "@/lib/dashboard/workspace";

export type WorkspaceIdentity =
  | "founder"
  | "creator"
  | "agency"
  | "solopreneur";

export type CreatorNiche =
  | "tech-ai"
  | "finance-business"
  | "lifestyle"
  | "coding-design";

export type FounderNiche = "b2b-saas" | "ai-tools" | "ecommerce";

export type AgencyNiche = "marketing-services" | "ai-implementation" | "growth-ops";

export type SolopreneurNiche =
  | "digital-products"
  | "freelance-ai"
  | "side-hustles";

export type NicheId =
  | CreatorNiche
  | FounderNiche
  | AgencyNiche
  | SolopreneurNiche;

export type UserOnboardingProfile = {
  identity: WorkspaceIdentity;
  niche: NicheId;
  nicheLabel: string;
  completedAt: string;
};

export const ONBOARDING_STORAGE_KEY = "aiscoutx-onboarding-profile";

export const IDENTITY_OPTIONS: {
  id: WorkspaceIdentity;
  label: string;
  description: string;
}[] = [
  { id: "founder", label: "Founder", description: "Build & launch startups" },
  { id: "creator", label: "Creator", description: "Content & audience growth" },
  { id: "agency", label: "Agency", description: "Client services & retainers" },
  {
    id: "solopreneur",
    label: "Solopreneur",
    description: "Solo offers & digital income",
  },
];

export const CREATOR_NICHES: { id: CreatorNiche; label: string }[] = [
  { id: "tech-ai", label: "Tech & AI" },
  { id: "finance-business", label: "Finance & Business" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "coding-design", label: "Coding & Design" },
];

export const FOUNDER_NICHES: { id: FounderNiche; label: string }[] = [
  { id: "b2b-saas", label: "B2B SaaS" },
  { id: "ai-tools", label: "AI Tools" },
  { id: "ecommerce", label: "E-commerce" },
];

export const AGENCY_NICHES: { id: AgencyNiche; label: string }[] = [
  { id: "marketing-services", label: "Marketing Services" },
  { id: "ai-implementation", label: "AI Implementation" },
  { id: "growth-ops", label: "Growth Ops" },
];

export const SOLOPRENEUR_NICHES: { id: SolopreneurNiche; label: string }[] = [
  { id: "digital-products", label: "Digital Products" },
  { id: "freelance-ai", label: "Freelance AI" },
  { id: "side-hustles", label: "Side Hustles" },
];

export function getNichesForIdentity(identity: WorkspaceIdentity) {
  switch (identity) {
    case "creator":
      return CREATOR_NICHES;
    case "founder":
      return FOUNDER_NICHES;
    case "agency":
      return AGENCY_NICHES;
    case "solopreneur":
      return SOLOPRENEUR_NICHES;
  }
}

export function getDefaultNicheForIdentity(identity: WorkspaceIdentity): {
  id: NicheId;
  label: string;
} {
  const niches = getNichesForIdentity(identity);
  return niches[0] ?? { id: "b2b-saas", label: "B2B SaaS" };
}

export function getNicheLabel(
  identity: WorkspaceIdentity,
  nicheId: NicheId
): string {
  const match = getNichesForIdentity(identity).find((n) => n.id === nicheId);
  return match?.label ?? nicheId;
}

export const NICHE_PREFS_STORAGE_KEY = "aiscoutx-niche-by-workspace";

export type NicheByWorkspace = Partial<
  Record<WorkspaceIdentity, { id: NicheId; label: string }>
>;

export function loadNicheByWorkspace(): NicheByWorkspace {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NICHE_PREFS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as NicheByWorkspace;
  } catch {
    return {};
  }
}

export function saveNicheByWorkspace(prefs: NicheByWorkspace): void {
  localStorage.setItem(NICHE_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

export function identityToWorkspaceMode(
  identity: WorkspaceIdentity
): WorkspaceMode {
  if (identity === "creator") return "creator";
  if (identity === "agency") return "agency";
  return "founder";
}

export function getFeedKey(profile: UserOnboardingProfile): string {
  return `${profile.identity}:${profile.niche}`;
}

export function loadOnboardingProfile(): UserOnboardingProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserOnboardingProfile;
  } catch {
    return null;
  }
}

export function saveOnboardingProfile(profile: UserOnboardingProfile): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile));
}
