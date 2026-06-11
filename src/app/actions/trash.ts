"use server";

import { revalidatePath } from "next/cache";

import { isProUser, UPGRADE_REQUIRED } from "@/lib/billing/paywall";
import { toClientError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type TrashItemKind = "project" | "blueprint";

export type TrashItem = {
  id: string;
  kind: TrashItemKind;
  title: string;
  deletedAt: string | null;
  /** Days left in the 30-day recovery window (0 when expired). */
  daysLeft: number;
};

export type TrashActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
};

const RECOVERY_WINDOW_DAYS = 30;

function daysLeftInWindow(deletedAt: string | null): number {
  if (!deletedAt) return RECOVERY_WINDOW_DAYS;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, RECOVERY_WINDOW_DAYS - elapsedDays);
}

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/trash");
  revalidatePath("/dashboard/blueprints");
}

export async function getTrashItems(): Promise<TrashItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const [workspacesRes, packsRes] = await Promise.all([
      supabase
        .from("workspaces")
        .select("id, opportunity_name, deleted_at")
        .eq("user_id", user.id)
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false }),
      supabase
        .from("venture_packs")
        .select("id, query, deleted_at")
        .eq("user_id", user.id)
        .eq("is_deleted", true)
        .order("deleted_at", { ascending: false }),
    ]);

    const projects: TrashItem[] = (workspacesRes.data ?? []).map((row) => ({
      id: row.id,
      kind: "project",
      title: row.opportunity_name,
      deletedAt: row.deleted_at,
      daysLeft: daysLeftInWindow(row.deleted_at),
    }));

    const blueprints: TrashItem[] = (packsRes.data ?? []).map((row) => ({
      id: row.id,
      kind: "blueprint",
      title: row.query,
      deletedAt: row.deleted_at,
      daysLeft: daysLeftInWindow(row.deleted_at),
    }));

    return [...projects, ...blueprints].sort((a, b) => {
      const ta = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const tb = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return tb - ta;
    });
  } catch {
    return [];
  }
}

export async function moveWorkspaceToTrash(
  workspaceId: string
): Promise<TrashActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("workspaces")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", workspaceId)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: "Could not move project to Trash." };

    revalidateDashboard();
    return { ok: true };
  } catch (err) {
    return toClientError("trash.deleteWorkspace", err, "Could not move project to Trash.");
  }
}

export async function moveVenturePackToTrash(
  packId: string
): Promise<TrashActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("venture_packs")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", packId)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: "Could not move blueprint to Trash." };

    revalidateDashboard();
    return { ok: true };
  } catch (err) {
    return toClientError("trash.deletePack", err, "Could not move blueprint to Trash.");
  }
}

export async function recoverTrashItem(
  kind: TrashItemKind,
  id: string
): Promise<TrashActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const pro = await isProUser();
    if (!pro) {
      return {
        ok: false,
        code: UPGRADE_REQUIRED,
        error:
          "Trash recovery is a Pro feature. Upgrade to restore projects and blueprints within 30 days.",
      };
    }

    const table = kind === "project" ? "workspaces" : "venture_packs";
    const { error } = await supabase
      .from(table)
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: "Could not recover this item." };

    revalidateDashboard();
    return { ok: true };
  } catch (err) {
    return toClientError("trash.recover", err, "Could not recover this item.");
  }
}

export async function permanentDeleteTrashItem(
  kind: TrashItemKind,
  id: string
): Promise<TrashActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    if (kind === "project") {
      await supabase.from("daily_tasks").delete().eq("workspace_id", id);
      await supabase
        .from("workspace_signal_snapshots")
        .delete()
        .eq("workspace_id", id);
    }

    const table = kind === "project" ? "workspaces" : "venture_packs";
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_deleted", true);

    if (error) return { ok: false, error: "Could not delete this item." };

    revalidateDashboard();
    return { ok: true };
  } catch (err) {
    return toClientError("trash.permanentDelete", err, "Could not delete this item.");
  }
}
