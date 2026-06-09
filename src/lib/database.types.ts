import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { TrendStage } from "@/lib/dashboard/opportunities";
import type { PlanTier } from "@/lib/billing/tier-limits";
import type {
  AnalyzePack,
  BlueprintPack,
  LaunchPack,
} from "@/lib/mvp/types";
import type {
  CoreGoal,
  FounderStage,
  GpsVector,
  NicheFocus,
  WorkspaceSummary,
} from "@/lib/founder/types";

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
  onboarding_completed: boolean;
  persona: WorkspaceIdentity | null;
  goal: CoreGoal | null;
  niche_focus: NicheFocus | null;
  plan: PlanTier;
  created_at: string;
  updated_at: string;
};

export type UsageWalletRow = {
  user_id: string;
  opportunity_views_today: number;
  opportunity_views_date: string;
  blueprints_this_month: number;
  blueprints_month_key: string;
  chat_messages_this_month: number;
  chat_month_key: string;
  updated_at: string;
};

export type VenturePackRow = {
  id: string;
  user_id: string;
  query: string;
  analyze_json: AnalyzePack;
  blueprint_json: BlueprintPack;
  launch_json: LaunchPack;
  created_at: string;
};

export type WorkspaceRow = {
  id: string;
  user_id: string;
  opportunity_id: string | null;
  opportunity_name: string;
  summary_json: WorkspaceSummary;
  current_stage: FounderStage;
  validation_score: number;
  mvp_score: number;
  launch_score: number;
  sales_score: number;
  created_at: string;
  updated_at: string;
};

export type DailyTaskRow = {
  id: string;
  workspace_id: string;
  task_text: string;
  is_completed: boolean;
  stage_type: GpsVector;
  created_at: string;
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
          onboarding_completed?: boolean;
          persona?: WorkspaceIdentity | null;
          goal?: CoreGoal | null;
          niche_focus?: NicheFocus | null;
          plan?: PlanTier;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          workspace_mode?: WorkspaceIdentity;
          current_niche?: string | null;
          onboarding_completed?: boolean;
          persona?: WorkspaceIdentity | null;
          goal?: CoreGoal | null;
          niche_focus?: NicheFocus | null;
          plan?: PlanTier;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_wallets: {
        Row: UsageWalletRow;
        Insert: {
          user_id: string;
          opportunity_views_today?: number;
          opportunity_views_date?: string;
          blueprints_this_month?: number;
          blueprints_month_key?: string;
          chat_messages_this_month?: number;
          chat_month_key?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UsageWalletRow, "user_id">>;
        Relationships: [];
      };
      venture_packs: {
        Row: VenturePackRow;
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          analyze_json?: AnalyzePack;
          blueprint_json?: BlueprintPack;
          launch_json?: LaunchPack;
          created_at?: string;
        };
        Update: Partial<Omit<VenturePackRow, "id" | "user_id">>;
        Relationships: [];
      };
      workspaces: {
        Row: WorkspaceRow;
        Insert: {
          id?: string;
          user_id: string;
          opportunity_id?: string | null;
          opportunity_name: string;
          summary_json?: WorkspaceSummary;
          current_stage?: FounderStage;
          validation_score?: number;
          mvp_score?: number;
          launch_score?: number;
          sales_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          opportunity_id: string | null;
          opportunity_name: string;
          summary_json: WorkspaceSummary;
          current_stage: FounderStage;
          validation_score: number;
          mvp_score: number;
          launch_score: number;
          sales_score: number;
        }>;
        Relationships: [];
      };
      daily_tasks: {
        Row: DailyTaskRow;
        Insert: {
          id?: string;
          workspace_id: string;
          task_text: string;
          is_completed?: boolean;
          stage_type: GpsVector;
          created_at?: string;
        };
        Update: Partial<{
          task_text: string;
          is_completed: boolean;
          stage_type: GpsVector;
        }>;
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
