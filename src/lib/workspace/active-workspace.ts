export const ACTIVE_WORKSPACE_STORAGE_KEY = "aiscoutx.active_workspace";
export const ACTIVE_WORKSPACE_FLAG_KEY = "aiscoutx_active_workspace";
export const ACTIVE_WORKSPACE_COOKIE = "aiscoutx_active_startup";
export const HAS_ACTIVE_STARTUP_COOKIE = "aiscoutx_has_active_startup";
export const ACTIVE_WORKSPACE_FLAG_COOKIE = "aiscoutx_active_workspace";
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

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  if (!canUseDom()) return;
  document.cookie = `${name}=${value}; path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function writeActiveFlagCookies(id?: string) {
  if (!canUseDom()) return;
  writeCookie(ACTIVE_WORKSPACE_FLAG_COOKIE, "true");
  writeCookie(HAS_ACTIVE_STARTUP_COOKIE, "1");
  if (id) {
    writeCookie(ACTIVE_WORKSPACE_COOKIE, encodeURIComponent(id));
  }
}

function writeInactiveFlagCookies() {
  if (!canUseDom()) return;
  writeCookie(ACTIVE_WORKSPACE_FLAG_COOKIE, "false");
  writeCookie(HAS_ACTIVE_STARTUP_COOKIE, "false");
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
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
    window.localStorage.setItem(ACTIVE_WORKSPACE_FLAG_KEY, "true");
  } catch {
    // Private mode / quota — cookie still routes.
  }
  writeActiveFlagCookies(input.id);
  return state;
}

export function hasClientActiveWorkspace(): boolean {
  if (!canUseDom()) return false;
  try {
    const flag = window.localStorage.getItem(ACTIVE_WORKSPACE_FLAG_KEY);
    if (flag === "false") return false;
    if (flag === "true") return true;
    return readActiveWorkspace() !== null;
  } catch {
    return false;
  }
}

export function readActiveWorkspace(): ActiveWorkspaceState | null {
  if (!canUseDom()) return null;
  try {
    if (window.localStorage.getItem(ACTIVE_WORKSPACE_FLAG_KEY) === "false") {
      return null;
    }
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
    window.localStorage.setItem(ACTIVE_WORKSPACE_FLAG_KEY, "false");
  } catch {
    // no-op
  }
  writeInactiveFlagCookies();
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
    var flag = localStorage.getItem(${JSON.stringify(ACTIVE_WORKSPACE_FLAG_KEY)});
    if (flag === "false") return;
    var id = "";
    var raw = localStorage.getItem(${JSON.stringify(ACTIVE_WORKSPACE_STORAGE_KEY)});
    if (raw) {
      var state = JSON.parse(raw);
      if (state && state.has_active_startup && state.active_startup_id) {
        id = String(state.active_startup_id);
      }
    }
    if (flag !== "true" && !id) return;
    var maxAge = 31536000;
    document.cookie = "${ACTIVE_WORKSPACE_FLAG_COOKIE}=true; path=/; Max-Age=" + maxAge + "; SameSite=Lax";
    document.cookie = "${HAS_ACTIVE_STARTUP_COOKIE}=1; path=/; Max-Age=" + maxAge + "; SameSite=Lax";
    if (id && id.indexOf("/") === -1 && id.indexOf("..") === -1) {
      document.cookie = "${ACTIVE_WORKSPACE_COOKIE}=" + encodeURIComponent(id) + "; path=/; Max-Age=" + maxAge + "; SameSite=Lax";
      location.replace("/dashboard/workspace/" + encodeURIComponent(id));
      return;
    }
    location.replace("/dashboard/workspace");
  } catch (e) {}
})();`;
