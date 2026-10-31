"use server";

import type { WorkspaceChatMessage } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type PersistedMentorChat = {
  id: string;
  title: string;
  messages: WorkspaceChatMessage[];
  isDeleted?: boolean;
  isPinned?: boolean;
};

export type WorkspaceChatSnapshot = {
  ok: boolean;
  chats: PersistedMentorChat[];
  activeChatId: string;
  error?: string;
};

const MAX_MESSAGE_CHARS = 50_000;

function sanitizeMessages(messages: WorkspaceChatMessage[] | undefined): WorkspaceChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));
}

export async function loadWorkspaceChats(
  workspaceId: string
): Promise<WorkspaceChatSnapshot> {
  if (!isSupabaseConfigured() || !workspaceId) {
    return { ok: false, chats: [], activeChatId: "", error: "Supabase or workspace not configured." };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, chats: [], activeChatId: "", error: "Sign in required." };
    }

    const { data, error } = await supabase
      .from("workspace_chats")
      .select("id, title, messages, is_deleted, is_pinned, is_active, sort_order")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false });

    if (error) {
      return { ok: false, chats: [], activeChatId: "", error: error.message };
    }
    if (!data) {
      return { ok: false, chats: [], activeChatId: "", error: "No chat data returned." };
    }

    const chats: PersistedMentorChat[] = data.map((row) => ({
      id: row.id,
      title: row.title,
      messages: sanitizeMessages(
        Array.isArray(row.messages) ? (row.messages as WorkspaceChatMessage[]) : []
      ),
      isDeleted: row.is_deleted,
      isPinned: row.is_pinned,
    }));
    const active = data.find((row) => row.is_active && !row.is_deleted);
    return {
      ok: true,
      chats,
      activeChatId: active?.id ?? chats.find((chat) => !chat.isDeleted)?.id ?? "",
    };
  } catch (err) {
    return {
      ok: false,
      chats: [],
      activeChatId: "",
      error: err instanceof Error ? err.message : "Failed to load chats.",
    };
  }
}

export async function saveWorkspaceChats(
  workspaceId: string,
  chats: PersistedMentorChat[],
  activeChatId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !workspaceId) {
    return { ok: false, error: "Supabase or workspace not configured." };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Sign in required." };
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (workspaceError) {
      return { ok: false, error: workspaceError.message };
    }
    if (!workspace) {
      return {
        ok: false,
        error: "Workspace not found for this account. Open the workspace from Discover first.",
      };
    }

    const normalized = chats.map((chat, index) => ({
      id: chat.id,
      workspace_id: workspaceId,
      user_id: user.id,
      title: (chat.title?.trim() || "New Conversation").slice(0, 180),
      messages: sanitizeMessages(chat.messages),
      is_deleted: Boolean(chat.isDeleted),
      is_pinned: Boolean(chat.isPinned),
      is_active: chat.id === activeChatId && !chat.isDeleted,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }));

    if (normalized.length) {
      const { error: upsertError } = await supabase
        .from("workspace_chats")
        .upsert(normalized, { onConflict: "workspace_id,id" });

      if (upsertError) {
        return { ok: false, error: upsertError.message };
      }
    }

    const keepIds = normalized.map((row) => row.id);
    const { data: existing, error: listError } = await supabase
      .from("workspace_chats")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id);

    if (listError) {
      return { ok: false, error: listError.message };
    }

    const orphanIds =
      existing?.map((row) => row.id).filter((id) => !keepIds.includes(id)) ?? [];

    if (orphanIds.length) {
      const { error: deleteError } = await supabase
        .from("workspace_chats")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .in("id", orphanIds);

      if (deleteError) {
        return { ok: false, error: deleteError.message };
      }
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save chats.",
    };
  }
}
