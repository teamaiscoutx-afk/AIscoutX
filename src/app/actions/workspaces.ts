"use server";

import { revalidatePath } from "next/cache";

import { checkBlueprintGeneration, incrementBlueprintUsage } from "@/app/actions/usage";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { DailyTaskRow, WorkspaceRow } from "@/lib/database.types";
import {
  buildWorkspaceSummaryFromOpportunity,
  deriveNextAction,
  scoreIncrement,
  type DailyTask,
  type GpsVector,
  type StartupWorkspace,
} from "@/lib/founder/types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Mock/seed opportunities may use numeric ids — only persist real UUID FKs. */
function toNullableOpportunityId(id: string | null | undefined): string | null {
  if (!id || !UUID_REGEX.test(id)) {
    return null;
  }
  return id;
}

function mapWorkspace(row: WorkspaceRow): StartupWorkspace {
  return {
    id: row.id,
    userId: row.user_id,
    opportunityId: row.opportunity_id,
    opportunityName: row.opportunity_name,
    summary: row.summary_json,
    currentStage: row.current_stage,
    validationScore: row.validation_score,
    mvpScore: row.mvp_score,
    launchScore: row.launch_score,
    salesScore: row.sales_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: DailyTaskRow): DailyTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    taskText: row.task_text,
    isCompleted: row.is_completed,
    stageType: row.stage_type,
    createdAt: row.created_at,
  };
}

export async function getUserWorkspaces(): Promise<StartupWorkspace[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapWorkspace);
  } catch {
    return [];
  }
}

export async function getWorkspaceById(
  workspaceId: string
): Promise<StartupWorkspace | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return mapWorkspace(data);
  } catch {
    return null;
  }
}

export async function createWorkspaceFromOpportunity(
  opportunity: Opportunity
): Promise<{ ok: boolean; workspaceId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const gate = await checkBlueprintGeneration();
    if (!gate.allowed) {
      return { ok: false, error: gate.reason };
    }

    const summary = buildWorkspaceSummaryFromOpportunity(opportunity);
    const opportunityId = toNullableOpportunityId(opportunity.id);
    const nextAction = deriveNextAction({
      id: "",
      userId: user.id,
      opportunityId,
      opportunityName: opportunity.name,
      summary,
      currentStage: "validate",
      validationScore: 0,
      mvpScore: 0,
      launchScore: 0,
      salesScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        opportunity_id: opportunityId,
        opportunity_name: opportunity.name,
        summary_json: summary,
        current_stage: "validate",
      })
      .select("*")
      .single();

    if (workspaceError || !workspace) {
      return { ok: false, error: workspaceError?.message ?? "Workspace create failed" };
    }

    await incrementBlueprintUsage();

    await supabase.from("daily_tasks").insert({
      workspace_id: workspace.id,
      task_text: nextAction.taskText,
      stage_type: nextAction.vector,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workspace/${workspace.id}`);

    return { ok: true, workspaceId: workspace.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace create failed";
    return { ok: false, error: message };
  }
}

export async function getWorkspaceTasks(
  workspaceId: string
): Promise<DailyTask[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapTask);
  } catch {
    return [];
  }
}

export async function completeNextAction(
  workspaceId: string,
  taskId: string
): Promise<{
  ok: boolean;
  workspace?: StartupWorkspace;
  tasks?: DailyTask[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) return { ok: false, error: "Workspace not found" };

    const { data: task, error: taskError } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (taskError || !task) {
      return { ok: false, error: "Task not found" };
    }

    await supabase
      .from("daily_tasks")
      .update({ is_completed: true })
      .eq("id", taskId);

    const scoreField = {
      validation: "validation_score",
      mvp: "mvp_score",
      launch: "launch_score",
      sales: "sales_score",
    }[task.stage_type as GpsVector] as
      | "validation_score"
      | "mvp_score"
      | "launch_score"
      | "sales_score";

    const currentScore = {
      validation_score: workspace.validationScore,
      mvp_score: workspace.mvpScore,
      launch_score: workspace.launchScore,
      sales_score: workspace.salesScore,
    }[scoreField];

    const updatedScore = scoreIncrement(currentScore);

    const stageFromScores = (): StartupWorkspace["currentStage"] => {
      const scores = {
        validation: scoreField === "validation_score" ? updatedScore : workspace.validationScore,
        mvp: scoreField === "mvp_score" ? updatedScore : workspace.mvpScore,
        launch: scoreField === "launch_score" ? updatedScore : workspace.launchScore,
        sales: scoreField === "sales_score" ? updatedScore : workspace.salesScore,
      };
      if (scores.validation < 50) return "validate";
      if (scores.mvp < 50) return "build";
      if (scores.launch < 50) return "launch";
      return "grow";
    };

    const nextStage = stageFromScores();
    const scoreUpdate =
      scoreField === "validation_score"
        ? { validation_score: updatedScore, current_stage: nextStage }
        : scoreField === "mvp_score"
          ? { mvp_score: updatedScore, current_stage: nextStage }
          : scoreField === "launch_score"
            ? { launch_score: updatedScore, current_stage: nextStage }
            : { sales_score: updatedScore, current_stage: nextStage };

    const { data: updated, error: updateError } = await supabase
      .from("workspaces")
      .update(scoreUpdate)
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return { ok: false, error: updateError?.message ?? "Score update failed" };
    }

    const mapped = mapWorkspace(updated);
    const next = deriveNextAction(mapped);

    await supabase.from("daily_tasks").insert({
      workspace_id: workspaceId,
      task_text: next.taskText,
      stage_type: next.vector,
    });

    const tasks = await getWorkspaceTasks(workspaceId);

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workspace/${workspaceId}`);

    return { ok: true, workspace: mapped, tasks };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete action failed";
    return { ok: false, error: message };
  }
}
