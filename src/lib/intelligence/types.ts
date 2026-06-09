import type { ScoreBreakdown, TrendStage } from "@/lib/dashboard/opportunities";
import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";

export type WebSnippet = {
  source: string;
  title: string;
  excerpt: string;
  url: string;
  publishedAt?: string;
};

export type SearchChannel = "reddit" | "x" | "google" | "youtube" | "producthunt" | "github";

export type ChannelSearchResult = {
  channel: SearchChannel;
  query: string;
  snippets: WebSnippet[];
  resultCount: number;
};

export type ComputedMetrics = {
  mentionVolume: number;
  redditMentions: number;
  xMentions: number;
  youtubeMentions: number;
  productHuntMentions: number;
  githubMentions: number;
  complaintSignals: number;
  competitorAlternatives: number;
  recentVelocity: number;
  aiAutomationFit: number;
};

export type ScoreEngineOutput = {
  scores: ScoreBreakdown & { disruption: number };
  overallScore: number;
  growthLabel: string;
  trendStage: TrendStage;
  competitionLabel: "Low" | "Medium" | "High";
  aiConfidence: number;
  metrics: ComputedMetrics;
};

export type MarketGap = {
  competitor: string;
  complaint: string;
  source: string;
  url: string;
};

export type MvpAnatomy = {
  coreFlow: [string, string, string, string];
  techStack: { layer: string; tool: string; rationale: string }[];
  mustHave: string[];
  niceToHave: string[];
};

export type SolutionBlueprint = {
  overview: string;
  businessModel: string;
  goToMarket: string[];
  technicalArchitecture: string[];
  risks: string[];
};

export type OpportunityDeepDive = {
  marketGaps: MarketGap[];
  solutionBlueprint: SolutionBlueprint;
  mvpAnatomy: MvpAnatomy;
  evidenceUrls: string[];
  synthesizedAt: string;
};

export type LiveOpportunityDraft = {
  name: string;
  category: string;
  keywords: string[];
  sources: string[];
  revenuePotential: string;
  intelligence: ModeIntelligence;
  deepDive: OpportunityDeepDive;
  scores: ScoreEngineOutput;
};

export type IntelligenceConfig = {
  hasWebSearch: boolean;
  hasLlm: boolean;
  webProvider: "tavily" | "serper" | "perplexity" | null;
  llmProvider: "openai" | "anthropic" | null;
};

export type WorkspaceSignalDelta = {
  workspaceId: string;
  nicheFocus: string;
  demandDelta: number;
  competitionDelta: number;
  disruptionDelta: number;
  painPoint: string;
  solutionHint: string;
};

export type PlatformNotificationPayload = {
  title: string;
  body: string;
  emoji: string;
  signalType: "pain_point" | "momentum" | "competition" | "system";
  workspaceId?: string;
  metadata?: Record<string, unknown>;
};

export type DiscoveryContext = {
  workspace: WorkspaceIdentity;
  niche: NicheId;
  nicheLabel: string;
  seedTokens: string[];
};
