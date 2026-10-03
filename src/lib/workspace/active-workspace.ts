export const ACTIVE_WORKSPACE_STORAGE_KEY = "aiscoutx.active_workspace";
export const ACTIVE_WORKSPACE_COOKIE = "aiscoutx_active_startup";
export const HAS_ACTIVE_STARTUP_COOKIE = "aiscoutx_has_active_startup";
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

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function writeCookies(id: string) {
  if (!canUseDom()) return;
  const maxAge = 60 * 60 * 24 * 365;
  const encoded = encodeURIComponent(id);
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `${HAS_ACTIVE_STARTUP_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookies() {
  if (!canUseDom()) return;
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${HAS_ACTIVE_STARTUP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
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

  if (!canUseDom()) return state;

  try {
    window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota — cookie still routes.
  }
  writeCookies(input.id);
  return state;
}

export function readActiveWorkspace(): ActiveWorkspaceState | null {
  if (!canUseDom()) return null;
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
  if (!canUseDom()) return;
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
  if (!canUseDom()) return null;
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
  if (!canUseDom()) return;
  try {
    window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  } catch {
    // no-op
  }
  clearCookies();
}

/** Inline boot script: hard-redirect returning users before React hydrates. */
export const ACTIVE_WORKSPACE_BOOT_SCRIPT = `(function(){
  try {
    var path = location.pathname;
    if (path.indexOf("/dashboard/workspace") === 0) return;
    var allowDiscover = /[?&]intent=discover(?:&|$)/.test(location.search);
    if (path.indexOf("/dashboard/discover") === 0 && allowDiscover) return;
    var isAppEntry = path === "/" || path === "/dashboard" || path === "/dashboard/" || path.indexOf("/dashboard/discover") === 0;
    if (!isAppEntry) return;
    var raw = localStorage.getItem(${JSON.stringify(ACTIVE_WORKSPACE_STORAGE_KEY)});
    if (!raw) return;
    var state = JSON.parse(raw);
    if (!state || !state.has_active_startup || !state.active_startup_id) return;
    var id = String(state.active_startup_id);
    if (!id || id.indexOf("/") !== -1 || id.indexOf("..") !== -1) return;
    var maxAge = 31536000;
    document.cookie = "${ACTIVE_WORKSPACE_COOKIE}=" + encodeURIComponent(id) + "; Path=/; Max-Age=" + maxAge + "; SameSite=Lax";
    document.cookie = "${HAS_ACTIVE_STARTUP_COOKIE}=1; Path=/; Max-Age=" + maxAge + "; SameSite=Lax";
    location.replace("/dashboard/workspace/" + encodeURIComponent(id));
  } catch (e) {}
})();`;
