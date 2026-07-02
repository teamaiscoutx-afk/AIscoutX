import type { ModeIntelligence } from "@/lib/dashboard/workspace";
import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { TrendStage } from "@/lib/dashboard/opportunities";
import type { OpportunityDeepDive } from "@/lib/intelligence/types";
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
  deepDive?: OpportunityDeepDive;
  disruption?: number;
  liveSynthesizedAt?: string;
  /** Distinguishes Tavily/OpenAI rows from legacy seed catalog entries. */
  catalogSource?: "live" | "seed" | "optimized";
  /** Nested score block persisted for 10-idea live cards (snake/camel tolerant reads). */
  scores?: {
    demand?: number;
    competition?: number;
    virality?: number;
    monetization?: number;
    momentum?: number;
    disruption?: number;
  };
  /** Generated venture pack stored on the opportunities table, scoped by ownerId. */
  venturePack?: VenturePackData;
};

export type VenturePackData = {
  ownerId: string;
  query: string;
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
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
  subscription_status: "active" | "canceled";
  stripe_customer_id: string | null;
  subscription_renewal_at: string | null;
  last_renewal_warning_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UsageWalletRow = {
  user_id: string;
  opportunity_views_today: number;
  opportunity_views_date: string;
  opportunity_expansions_this_month: number;
  expansions_month_key: string;
  blueprints_this_month: number;
  blueprints_month_key: string;
  chat_messages_this_month: number;
  chat_month_key: string;
  updated_at: string;
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
  is_active: boolean;
  niche_focus: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceSignalSnapshotRow = {
  id: string;
  workspace_id: string;
  demand_score: number;
  competition_score: number;
  disruption_score: number;
  raw_signals: Record<string, unknown>;
  captured_at: string;
};

export type PlatformNotificationRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  body: string;
  emoji: string;
  signal_type: "pain_point" | "momentum" | "competition" | "system";
  is_read: boolean;
  source_link: string | null;
  niche_focus: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
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
  is_deleted: boolean;
  deleted_at: string | null;
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
          subscription_status?: "active" | "canceled";
          stripe_customer_id?: string | null;
          subscription_renewal_at?: string | null;
          last_renewal_warning_at?: string | null;
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
          subscription_status?: "active" | "canceled";
          stripe_customer_id?: string | null;
          subscription_renewal_at?: string | null;
          last_renewal_warning_at?: string | null;
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
          opportunity_expansions_this_month?: number;
          expansions_month_key?: string;
          blueprints_this_month?: number;
          blueprints_month_key?: string;
          chat_messages_this_month?: number;
          chat_month_key?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UsageWalletRow, "user_id">>;
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
          is_active?: boolean;
          niche_focus?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
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
          is_active: boolean;
          niche_focus: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      workspace_signal_snapshots: {
        Row: WorkspaceSignalSnapshotRow;
        Insert: {
          id?: string;
          workspace_id: string;
          demand_score?: number;
          competition_score?: number;
          disruption_score?: number;
          raw_signals?: Record<string, unknown>;
          captured_at?: string;
        };
        Update: Partial<Omit<WorkspaceSignalSnapshotRow, "id" | "workspace_id">>;
        Relationships: [];
      };
      platform_notifications: {
        Row: PlatformNotificationRow;
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          title: string;
          body: string;
          emoji?: string;
          signal_type: PlatformNotificationRow["signal_type"];
          is_read?: boolean;
          source_link?: string | null;
          niche_focus?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<{
          is_read: boolean;
          title: string;
          body: string;
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
          is_deleted?: boolean;
          deleted_at?: string | null;
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
          is_deleted: boolean;
          deleted_at: string | null;
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
