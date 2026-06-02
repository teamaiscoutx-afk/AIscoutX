export type WorkspaceMode = "founder" | "creator" | "agency";

export const WORKSPACE_MODES: {
  id: WorkspaceMode;
  label: string;
  description: string;
}[] = [
  {
    id: "founder",
    label: "Founder",
    description: "Startup & MVP playbooks",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Content & viral hooks",
  },
  {
    id: "agency",
    label: "Agency",
    description: "High-ticket service offers",
  },
];

export type FounderIntelligence = {
  problem: string;
  solution: string;
  mvp: string;
  launchTime: string;
};

export type CreatorIntelligence = {
  videoTitles: [string, string, string];
  hooks: [string, string];
  platform: string;
};

export type AgencyIntelligence = {
  serviceOffer: string;
  icp: string;
  retainer: string;
};

export type ModeIntelligence = {
  founder: FounderIntelligence;
  creator: CreatorIntelligence;
  agency: AgencyIntelligence;
};
