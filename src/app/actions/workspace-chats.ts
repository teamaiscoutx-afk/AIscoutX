"use server";

import type {
  PersistedMentorChat,
  WorkspaceChatSnapshot,
} from "@/lib/mentor/workspace-chat-types";
import {
  loadWorkspaceChatsSecure,
  saveWorkspaceChatsSecure,
  sanitizeWorkspaceChatMessages,
} from "@/lib/server/workspace-chats.server";

export type { PersistedMentorChat, WorkspaceChatSnapshot };

export async function loadWorkspaceChats(
  workspaceId: string
): Promise<WorkspaceChatSnapshot> {
  return loadWorkspaceChatsSecure(workspaceId);
}

export async function saveWorkspaceChats(
  workspaceId: string,
  chats: PersistedMentorChat[],
  activeChatId: string
): Promise<{ ok: boolean; error?: string }> {
  return saveWorkspaceChatsSecure(workspaceId, chats, activeChatId);
}

export { sanitizeWorkspaceChatMessages };
