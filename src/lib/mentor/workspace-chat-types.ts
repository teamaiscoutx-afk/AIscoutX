import type { WorkspaceChatMessage } from "@/lib/database.types";

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
