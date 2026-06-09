export type AnalyzePack = {
  problemStatement: string;
  marketSizing: {
    tam: string;
    sam: string;
    som: string;
    growthRate: string;
  };
  targetPersonas: { name: string; pain: string; willingnessToPay: string }[];
  competitors: { name: string; gap: string; positioning: string }[];
};

export type BlueprintPack = {
  nameSuggestions: string[];
  featureMatrix: {
    mustHave: string[];
    niceToHave: string[];
    future: string[];
  };
  pricingTiers: { name: string; price: string; features: string[] }[];
  techStack: { layer: string; recommendation: string; rationale: string }[];
  roadmap: { week: number; milestone: string; tasks: string[] }[];
};

export type LaunchPack = {
  platforms: {
    platform: "Reddit" | "LinkedIn" | "X" | "Product Hunt";
    playbook: string[];
    samplePost: string;
  }[];
  outreachScripts: {
    channel: string;
    subject: string;
    body: string;
  }[];
};

export type VenturePack = {
  id: string;
  userId: string;
  query: string;
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
  createdAt: string;
};
