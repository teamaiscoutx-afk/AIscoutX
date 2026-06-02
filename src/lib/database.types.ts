import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { TrendStage } from "@/lib/dashboard/opportunities";

/** Drawer copy stored in opportunities.mode_data */
export type OpportunityDrawerData = {
  whyThisMatters: string;
  recommendedAction: string;
  targetClients: string;
  viralVideoIdeas: string[];
};

/** Extended metadata inside opportunities.mode_data */
export type OpportunityModeData = {
  aiConfidence?: number;
  competitionLabel?: string;
  trendStage?: TrendStage;
  virality?: number;
  monetization?: number;
  revenuePotential?: string;
  sources?: string[];
  keywords?: string[];
  hot?: boolean;
  intelligence?: ModeIntelligence;
  drawer?: OpportunityDrawerData;
  /** Markdown action plan for drawer / detail views */
  actionPlanMarkdown?: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  workspace_mode: WorkspaceIdentity;
  current_niche: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityRow = {
  id: string;
  title: string;
  score: number;
  growth: string;
  demand: number;
  competition: number;
  category: string;
  workspace_mode: WorkspaceIdentity | null;
  current_niche: string | null;
  mode_data: OpportunityModeData;
  created_at: string;
};

export type SavedOpportunityRow = {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
};

export type WaitlistRow = {
  id: string;
  email: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: WaitlistRow;
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          workspace_mode?: WorkspaceIdentity;
          current_niche?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          workspace_mode?: WorkspaceIdentity;
          current_niche?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: {
          id?: string;
          title: string;
          score?: number;
          growth?: string;
          demand?: number;
          competition?: number;
          category: string;
          workspace_mode?: WorkspaceIdentity | null;
          current_niche?: string | null;
          mode_data?: OpportunityModeData;
          created_at?: string;
        };
        Update: Partial<{
          title: string;
          score: number;
          growth: string;
          demand: number;
          competition: number;
          category: string;
          workspace_mode: WorkspaceIdentity | null;
          current_niche: string | null;
          mode_data: OpportunityModeData;
        }>;
        Relationships: [];
      };
      saved_opportunities: {
        Row: SavedOpportunityRow;
        Insert: {
          id?: string;
          user_id: string;
          opportunity_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          opportunity_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
