"use server";

import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { ProfileRow } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateProfileWorkspace(
  workspaceMode: WorkspaceIdentity,
  currentNiche: NicheId
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        workspace_mode: workspaceMode,
        current_niche: currentNiche,
      })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Profile update failed" };
  }
}
