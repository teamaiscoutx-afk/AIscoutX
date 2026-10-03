export const ACTIVE_WORKSPACE_STORAGE_KEY = "aiscoutx.active_workspace";
export const ACTIVE_WORKSPACE_COOKIE = "aiscoutx_active_startup";
export const ACTIVE_CHATS_STORAGE_PREFIX = "aiscoutx.workspace.chats.";

export type ActiveWorkspaceState = {
  has_active_startup: boolean;
  active_startup_id: string;
  active_startup_name: string;
};

export const DEFAULT_CHAT_SEED = [
  {
    id: "chat-1",
    title: "Initial Strategy & Target Audience",
    messages: [] as { role: "assistant" | "user"; content: string }[],
  },
  {
    id: "chat-2",
    title: "Pricing & Unit Economics",
    messages: [] as { role: "assistant" | "user"; content: string }[],
  },
];

export type PersistedChatSession = {
  id: string;
  title: string;
  messages: { role: "assistant" | "user"; content: string }[];
  isDeleted?: boolean;
};

export type PersistedChatState = {
  chats: PersistedChatSession[];
  activeChatId: string;
};

function writeCookie(id: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function persistActiveWorkspace(input: {
  id: string;
  name: string;
}): ActiveWorkspaceState {
  const state: ActiveWorkspaceState = {
    has_active_startup: true,
    active_startup_id: input.id,
    active_startup_name: input.name,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / private-mode failures — cookie still routes.
    }
    writeCookie(input.id);
  }

  return state;
}

export function readActiveWorkspace(): ActiveWorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkspaceState;
    if (!parsed?.has_active_startup || !parsed.active_startup_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistWorkspaceChats(
  workspaceId: string,
  state: PersistedChatState
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${ACTIVE_CHATS_STORAGE_PREFIX}${workspaceId}`,
      JSON.stringify(state)
    );
  } catch {
    // Keep the live session even if storage is full.
  }
}

export function readWorkspaceChats(workspaceId: string): PersistedChatState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${ACTIVE_CHATS_STORAGE_PREFIX}${workspaceId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedChatState;
    if (!Array.isArray(parsed?.chats) || parsed.chats.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveWorkspace(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  } catch {
    // no-op
  }
  clearCookie();
}
