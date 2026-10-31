import type { PersistedMentorChat } from "@/lib/mentor/workspace-chat-types";

const RETRY_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWorkspaceChatSnapshot(workspaceId: string): Promise<{
  ok: boolean;
  chats: PersistedMentorChat[];
  activeChatId: string;
}> {
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(
        `/api/workspace/chats?workspaceId=${encodeURIComponent(workspaceId)}`,
        { cache: "no-store", credentials: "same-origin" }
      );
      const snapshot = (await response.json()) as {
        ok?: boolean;
        chats?: PersistedMentorChat[];
        activeChatId?: string;
      };
      if (response.ok && snapshot.ok && Array.isArray(snapshot.chats)) {
        return {
          ok: true,
          chats: snapshot.chats,
          activeChatId: snapshot.activeChatId ?? "",
        };
      }
    } catch {
      // retry
    }
    if (attempt < RETRY_ATTEMPTS - 1) {
      await sleep(250 * (attempt + 1));
    }
  }

  return { ok: false, chats: [], activeChatId: "" };
}

export async function persistWorkspaceChats(input: {
  workspaceId: string;
  chats: PersistedMentorChat[];
  activeChatId: string;
}): Promise<boolean> {
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("/api/workspace/chats", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const saved = (await response.json()) as { ok?: boolean };
      if (response.ok && saved.ok) {
        return true;
      }
    } catch {
      // retry
    }
    if (attempt < RETRY_ATTEMPTS - 1) {
      await sleep(280 * (attempt + 1));
    }
  }
  return false;
}
