"use server";

import { revalidatePath } from "next/cache";

import { sendNicheAlertEmail } from "@/lib/email";
import { scanWorkspaceForSignals } from "@/lib/intelligence/workspace-sync";
import type { PlatformNotificationPayload } from "@/lib/intelligence/types";
import { isIntelligenceEngineReady } from "@/lib/intelligence/env";
import { friendlyError } from "@/lib/server/friendly-errors";
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
  sourceLink?: string | null;
  nicheFocus?: string | null;
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

function mapNotificationRow(row: {
  id: string;
  title: string;
  body: string;
  emoji: string;
  is_read: boolean;
  signal_type: string;
  workspace_id: string | null;
  source_link?: string | null;
  niche_focus?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}): PlatformNotification {
  const metaUrl =
    typeof row.metadata?.evidenceUrl === "string"
      ? row.metadata.evidenceUrl
      : null;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    emoji: row.emoji,
    timestamp: formatTimestamp(row.created_at),
    isRead: row.is_read,
    signalType: row.signal_type,
    workspaceId: row.workspace_id,
    sourceLink: row.source_link ?? metaUrl,
    nicheFocus: row.niche_focus ?? null,
  };
}

export async function fetchNotifications(): Promise<PlatformNotification[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("niche_focus")
      .eq("id", user.id)
      .maybeSingle();

    const nicheFocus = profile?.niche_focus ?? null;

    let query = supabase
      .from("platform_notifications")
      .select(
        "id, title, body, emoji, is_read, signal_type, workspace_id, source_link, niche_focus, metadata, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (nicheFocus) {
      query = query.or(`niche_focus.eq.${nicheFocus},niche_focus.is.null`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(mapNotificationRow);
  } catch (err) {
    logServerError("notifications.fetch", err);
    return [];
  }
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured() || !ids.length) return;

  try {
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
  } catch (err) {
    logServerError("notifications.markRead", err);
  }
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
    source_link: payload.sourceLink ?? null,
    niche_focus: payload.nicheFocus ?? null,
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("niche_focus")
      .eq("id", user.id)
      .maybeSingle();

    const profileNiche = profile?.niche_focus ?? null;

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, opportunity_name, niche_focus, validation_score, mvp_score, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!workspaces?.length) {
      return { ok: true, scanned: 0, alerts: 0 };
    }

    let alerts = 0;

    for (const ws of workspaces) {
      const workspaceNiche = ws.niche_focus ?? profileNiche ?? ws.opportunity_name;

      if (profileNiche && ws.niche_focus && ws.niche_focus !== profileNiche) {
        continue;
      }

      const { data: lastSnapshot } = await supabase
        .from("workspace_signal_snapshots")
        .select("demand_score, competition_score, disruption_score")
        .eq("workspace_id", ws.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const result = await scanWorkspaceForSignals({
        id: ws.id,
        opportunityName: ws.opportunity_name,
        nicheFocus: workspaceNiche,
        validationScore: ws.validation_score,
        mvpScore: ws.mvp_score,
        previousDemand: lastSnapshot?.demand_score,
        previousCompetition: lastSnapshot?.competition_score,
        previousDisruption: lastSnapshot?.disruption_score,
      });

      if (
        result.validationScore !== ws.validation_score ||
        result.mvpScore !== ws.mvp_score
      ) {
        await supabase
          .from("workspaces")
          .update({
            validation_score: result.validationScore,
            mvp_score: result.mvpScore,
          })
          .eq("id", ws.id);
      }

      if (!ws.niche_focus && profileNiche) {
        await supabase
          .from("workspaces")
          .update({ niche_focus: profileNiche })
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
          sendNicheAlertEmail(user.email, {
            nicheFocus: result.delta.nicheFocus,
            painPoint: result.delta.painPoint,
            solutionHint: result.delta.solutionHint,
            sourceLink: result.notification.sourceLink,
            workspaceId: ws.id,
          }).catch((err) => logServerError("email.nicheAlert", err));
        }
      }
    }

    revalidatePath("/dashboard");
    return { ok: true, scanned: workspaces.length, alerts };
  } catch (err) {
    logServerError("notifications.syncSignals", err);
    return { ok: false, scanned: 0, alerts: 0 };
  }
}

export async function setWorkspaceActive(
  workspaceId: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Your workspace isn't connected yet. Try again shortly." };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in to manage workspaces." };

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
    return {
      ok: false,
      error: friendlyError(err, "We couldn't update that workspace. Please try again."),
    };
  }
}
