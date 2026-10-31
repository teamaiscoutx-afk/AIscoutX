import type { WorkspaceChatMessage } from "@/lib/database.types";
import type {
  PersistedMentorChat,
  WorkspaceChatSnapshot,
} from "@/lib/mentor/workspace-chat-types";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

const MAX_MESSAGE_CHARS = 50_000;
const SAVE_RETRY_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sanitizeWorkspaceChatMessages(
  messages: WorkspaceChatMessage[] | undefined
): WorkspaceChatMessage[] {
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

async function requireSessionUserId(): Promise<{ userId: string } | { error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }
  return { userId: user.id };
}

async function workspaceOwnedByUser(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const admin = createServiceRoleSupabaseClient();
  const client = admin ?? createServerSupabaseClient();

  const { data, error } = await client
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}

function mapRowsToChats(
  data: {
    id: string;
    title: string;
    messages: unknown;
    is_deleted: boolean;
    is_pinned: boolean;
    is_active: boolean;
  }[]
): { chats: PersistedMentorChat[]; activeChatId: string } {
  const chats: PersistedMentorChat[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    messages: sanitizeWorkspaceChatMessages(
      Array.isArray(row.messages) ? (row.messages as WorkspaceChatMessage[]) : []
    ),
    isDeleted: row.is_deleted,
    isPinned: row.is_pinned,
  }));
  const active = data.find((row) => row.is_active && !row.is_deleted);
  return {
    chats,
    activeChatId: active?.id ?? chats.find((chat) => !chat.isDeleted)?.id ?? "",
  };
}

export async function loadWorkspaceChatsSecure(
  workspaceId: string
): Promise<WorkspaceChatSnapshot> {
  if (!isSupabaseConfigured() || !workspaceId) {
    return { ok: false, chats: [], activeChatId: "", error: "Supabase or workspace not configured." };
  }

  const session = await requireSessionUserId();
  if ("error" in session) {
    return { ok: false, chats: [], activeChatId: "", error: session.error };
  }

  const owned = await workspaceOwnedByUser(workspaceId, session.userId);
  if (!owned) {
    return {
      ok: false,
      chats: [],
      activeChatId: "",
      error: "Workspace not found for this account.",
    };
  }

  const admin = createServiceRoleSupabaseClient();
  const reader = admin ?? createServerSupabaseClient();

  for (let attempt = 0; attempt < SAVE_RETRY_ATTEMPTS; attempt++) {
    const { data, error } = await reader
      .from("workspace_chats")
      .select("id, title, messages, is_deleted, is_pinned, is_active, sort_order")
      .eq("workspace_id", workspaceId)
      .eq("user_id", session.userId)
      .order("sort_order", { ascending: false });

    if (!error && data) {
      const mapped = mapRowsToChats(data);
      return { ok: true, ...mapped };
    }

    if (attempt < SAVE_RETRY_ATTEMPTS - 1) {
      await sleep(180 * (attempt + 1));
    } else {
      return {
        ok: false,
        chats: [],
        activeChatId: "",
        error: error?.message ?? "Failed to load chats.",
      };
    }
  }

  return { ok: false, chats: [], activeChatId: "", error: "Failed to load chats." };
}

async function upsertWorkspaceChatRows(input: {
  workspaceId: string;
  userId: string;
  chats: PersistedMentorChat[];
  activeChatId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createServiceRoleSupabaseClient();
  const writer = admin ?? createServerSupabaseClient();

  const normalized = input.chats.map((chat, index) => ({
    id: chat.id,
    workspace_id: input.workspaceId,
    user_id: input.userId,
    title: (chat.title?.trim() || "New Conversation").slice(0, 180),
    messages: sanitizeWorkspaceChatMessages(chat.messages),
    is_deleted: Boolean(chat.isDeleted),
    is_pinned: Boolean(chat.isPinned),
    is_active: chat.id === input.activeChatId && !chat.isDeleted,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  if (normalized.length) {
    const { error: upsertError } = await writer
      .from("workspace_chats")
      .upsert(normalized, { onConflict: "workspace_id,id" });

    if (upsertError) {
      return { ok: false, error: upsertError.message };
    }
  }

  const keepIds = normalized.map((row) => row.id);
  const { data: existing, error: listError } = await writer
    .from("workspace_chats")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId);

  if (listError) {
    return { ok: false, error: listError.message };
  }

  const orphanIds =
    existing?.map((row) => row.id).filter((id) => !keepIds.includes(id)) ?? [];

  if (orphanIds.length) {
    const { error: deleteError } = await writer
      .from("workspace_chats")
      .delete()
      .eq("workspace_id", input.workspaceId)
      .eq("user_id", input.userId)
      .in("id", orphanIds);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }
  }

  return { ok: true };
}

export async function saveWorkspaceChatsSecure(
  workspaceId: string,
  chats: PersistedMentorChat[],
  activeChatId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !workspaceId) {
    return { ok: false, error: "Supabase or workspace not configured." };
  }

  const session = await requireSessionUserId();
  if ("error" in session) {
    return { ok: false, error: session.error };
  }

  const owned = await workspaceOwnedByUser(workspaceId, session.userId);
  if (!owned) {
    return {
      ok: false,
      error: "Workspace not found for this account. Open the workspace from Discover first.",
    };
  }

  let lastError: string | undefined;
  for (let attempt = 0; attempt < SAVE_RETRY_ATTEMPTS; attempt++) {
    const result = await upsertWorkspaceChatRows({
      workspaceId,
      userId: session.userId,
      chats,
      activeChatId,
    });
    if (result.ok) {
      return { ok: true };
    }
    lastError = result.error;
    if (attempt < SAVE_RETRY_ATTEMPTS - 1) {
      await sleep(220 * (attempt + 1));
    }
  }

  return { ok: false, error: lastError ?? "Failed to save chats." };
}
