"use server";

import { revalidatePath } from "next/cache";

import { sendNicheAlertEmail } from "@/lib/email";
import { scanWorkspaceForSignals } from "@/lib/intelligence/workspace-sync";
import type { PlatformNotificationPayload } from "@/lib/intelligence/types";
import { isIntelligenceEngineReady } from "@/lib/intelligence/env";
import { logServerError } from "@/lib/server/safe-action";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type PlatformNotification = {
  id: string;
  title: string;
  body: string;
  emoji: string;
  timestamp: string;
  isRead: boolean;
  signalType: string;
  workspaceId?: string | null;
};

function formatTimestamp(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function fetchNotifications(): Promise<PlatformNotification[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("platform_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      emoji: row.emoji,
      timestamp: formatTimestamp(row.created_at),
      isRead: row.is_read,
      signalType: row.signal_type,
      workspaceId: row.workspace_id,
    }));
  } catch {
    return [];
  }
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured() || !ids.length) return;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("platform_notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .in("id", ids);

  revalidatePath("/dashboard");
}

async function insertNotification(
  userId: string,
  payload: PlatformNotificationPayload
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("platform_notifications").insert({
    user_id: userId,
    workspace_id: payload.workspaceId ?? null,
    title: payload.title,
    body: payload.body,
    emoji: payload.emoji,
    signal_type: payload.signalType,
    metadata: payload.metadata ?? {},
  });
}

export async function syncActiveWorkspaceSignals(): Promise<{
  ok: boolean;
  scanned: number;
  alerts: number;
}> {
  if (!isSupabaseConfigured() || !isIntelligenceEngineReady()) {
    return { ok: false, scanned: 0, alerts: 0 };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, scanned: 0, alerts: 0 };

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!workspaces?.length) {
      return { ok: true, scanned: 0, alerts: 0 };
    }

    let alerts = 0;

    for (const ws of workspaces) {
      const { data: lastSnapshot } = await supabase
        .from("workspace_signal_snapshots")
        .select("*")
        .eq("workspace_id", ws.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const result = await scanWorkspaceForSignals({
        id: ws.id,
        opportunityName: ws.opportunity_name,
        nicheFocus: ws.niche_focus ?? ws.opportunity_name,
        validationScore: ws.validation_score,
        mvpScore: ws.mvp_score,
        previousDemand: lastSnapshot?.demand_score,
        previousCompetition: lastSnapshot?.competition_score,
        previousDisruption: lastSnapshot?.disruption_score,
      });

      if (result.validationScore !== ws.validation_score || result.mvpScore !== ws.mvp_score) {
        await supabase
          .from("workspaces")
          .update({
            validation_score: result.validationScore,
            mvp_score: result.mvpScore,
          })
          .eq("id", ws.id);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("niche_focus")
        .eq("id", user.id)
        .maybeSingle();

      if (!ws.niche_focus && profile?.niche_focus) {
        await supabase
          .from("workspaces")
          .update({ niche_focus: profile.niche_focus })
          .eq("id", ws.id);
      }

      if (result.delta) {
        await supabase.from("workspace_signal_snapshots").insert({
          workspace_id: ws.id,
          demand_score:
            (lastSnapshot?.demand_score ?? 0) + result.delta.demandDelta,
          competition_score:
            (lastSnapshot?.competition_score ?? 0) + result.delta.competitionDelta,
          disruption_score:
            (lastSnapshot?.disruption_score ?? 0) + result.delta.disruptionDelta,
          raw_signals: result.delta,
        });
      }

      if (result.notification) {
        await insertNotification(user.id, result.notification);
        alerts += 1;

        if (user.email && result.delta) {
          // Priority inbox alert — fire-and-forget
          sendNicheAlertEmail(user.email, {
            nicheFocus: result.delta.nicheFocus,
            painPoint: result.delta.painPoint,
            solutionHint: result.delta.solutionHint,
            workspaceId: ws.id,
          }).catch((err) => logServerError("email.nicheAlert", err));
        }
      }
    }

    revalidatePath("/dashboard");
    return { ok: true, scanned: workspaces.length, alerts };
  } catch (err) {
    console.error("[syncActiveWorkspaceSignals]", err);
    return { ok: false, scanned: 0, alerts: 0 };
  }
}

export async function setWorkspaceActive(
  workspaceId: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    if (active) {
      await supabase
        .from("workspaces")
        .update({ is_active: false })
        .eq("user_id", user.id);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("niche_focus")
      .eq("id", user.id)
      .maybeSingle();

    await supabase
      .from("workspaces")
      .update({
        is_active: active,
        niche_focus: profile?.niche_focus ?? null,
      })
      .eq("id", workspaceId)
      .eq("user_id", user.id);

    if (active) {
      await syncActiveWorkspaceSignals();
    }

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update workspace";
    return { ok: false, error: message };
  }
}
