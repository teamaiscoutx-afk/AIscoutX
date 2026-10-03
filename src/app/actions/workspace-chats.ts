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
};

export async function loadWorkspaceChats(
  workspaceId: string
): Promise<WorkspaceChatSnapshot> {
  if (!isSupabaseConfigured() || !workspaceId) {
    return { ok: false, chats: [], activeChatId: "" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, chats: [], activeChatId: "" };

    const { data, error } = await supabase
      .from("workspace_chats")
      .select("id, title, messages, is_deleted, is_pinned, is_active, sort_order")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error || !data) return { ok: false, chats: [], activeChatId: "" };

    const chats: PersistedMentorChat[] = data.map((row) => ({
      id: row.id,
      title: row.title,
      messages: Array.isArray(row.messages) ? row.messages : [],
      isDeleted: row.is_deleted,
      isPinned: row.is_pinned,
    }));
    const active = data.find((row) => row.is_active && !row.is_deleted);
    return {
      ok: true,
      chats,
      activeChatId: active?.id ?? chats.find((chat) => !chat.isDeleted)?.id ?? "",
    };
  } catch {
    return { ok: false, chats: [], activeChatId: "" };
  }
}

export async function saveWorkspaceChats(
  workspaceId: string,
  chats: PersistedMentorChat[],
  activeChatId: string
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured() || !workspaceId) return { ok: false };

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!workspace) return { ok: false };

    await supabase
      .from("workspace_chats")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id);

    if (!chats.length) return { ok: true };

    const { error } = await supabase.from("workspace_chats").insert(
      chats.map((chat, index) => ({
        id: chat.id,
        workspace_id: workspaceId,
        user_id: user.id,
        title: chat.title.slice(0, 180) || "New Conversation",
        messages: chat.messages ?? [],
        is_deleted: Boolean(chat.isDeleted),
        is_pinned: Boolean(chat.isPinned),
        is_active: chat.id === activeChatId && !chat.isDeleted,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }))
    );

    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
