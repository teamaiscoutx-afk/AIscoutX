export const ACTIVE_WORKSPACE_STORAGE_KEY = "aiscoutx.active_workspace";
export const ACTIVE_WORKSPACE_FLAG_KEY = "aiscoutx_active_workspace";
export const ACTIVE_STARTUP_ID_KEY = "active_startup_id";
export const ACTIVE_WORKSPACE_COOKIE = "aiscoutx_active_startup";
export const HAS_ACTIVE_STARTUP_COOKIE = "aiscoutx_has_active_startup";
export const ACTIVE_WORKSPACE_FLAG_COOKIE = "aiscoutx_active_workspace";
export const ACTIVE_STARTUP_ID_COOKIE = "active_startup_id";
export const ACTIVE_CHATS_STORAGE_PREFIX = "aiscoutx.workspace.chats.";
export const COOKIE_MAX_AGE = 31536000;

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

/** Safari stores Secure cookies only on HTTPS; omit Secure on localhost HTTP. */
export function safariCookieAttributes(secure: boolean): string {
  return `Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function isHttpsDocument(): boolean {
  return canUseDom() && window.location.protocol === "https:";
}

function writeSafariCookie(name: string, value: string) {
  if (!canUseDom()) return;
  document.cookie = `${name}=${value}; ${safariCookieAttributes(isHttpsDocument())}`;
}

function expireSafariCookie(name: string) {
  if (!canUseDom()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${
    isHttpsDocument() ? "; Secure" : ""
  }`;
}

function writeStorage(key: string, value: string) {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode / quota — cookies still route.
  }
}

function readStorage(key: string): string | null {
  if (!canUseDom()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeActiveSignals(id?: string) {
  writeSafariCookie(ACTIVE_WORKSPACE_FLAG_COOKIE, "true");
  writeSafariCookie(HAS_ACTIVE_STARTUP_COOKIE, "1");
  writeStorage(ACTIVE_WORKSPACE_FLAG_KEY, "true");
  if (!id) return;
  const encoded = encodeURIComponent(id);
  writeSafariCookie(ACTIVE_STARTUP_ID_COOKIE, encoded);
  writeSafariCookie(ACTIVE_WORKSPACE_COOKIE, encoded);
  writeStorage(ACTIVE_STARTUP_ID_KEY, id);
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

  writeStorage(ACTIVE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  writeActiveSignals(input.id);
  return state;
}

export function hasClientActiveWorkspace(): boolean {
  if (!canUseDom()) return false;
  const flag = readStorage(ACTIVE_WORKSPACE_FLAG_KEY);
  if (flag === "false") return false;
  if (flag === "true") return true;
  const startupId = readStorage(ACTIVE_STARTUP_ID_KEY);
  if (startupId && startupId !== "false") return true;
  return readActiveWorkspace() !== null;
}

export function readActiveWorkspace(): ActiveWorkspaceState | null {
  if (!canUseDom()) return null;
  try {
    if (readStorage(ACTIVE_WORKSPACE_FLAG_KEY) === "false") return null;
    const raw = readStorage(ACTIVE_WORKSPACE_STORAGE_KEY);
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
  writeStorage(`${ACTIVE_CHATS_STORAGE_PREFIX}${workspaceId}`, JSON.stringify(state));
}

export function readWorkspaceChats(workspaceId: string): PersistedChatState | null {
  if (!canUseDom()) return null;
  try {
    const raw = readStorage(`${ACTIVE_CHATS_STORAGE_PREFIX}${workspaceId}`);
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
    window.localStorage.removeItem(ACTIVE_STARTUP_ID_KEY);
    window.localStorage.setItem(ACTIVE_WORKSPACE_FLAG_KEY, "false");
  } catch {
    // no-op
  }
  writeSafariCookie(ACTIVE_WORKSPACE_FLAG_COOKIE, "false");
  writeSafariCookie(HAS_ACTIVE_STARTUP_COOKIE, "false");
  expireSafariCookie(ACTIVE_WORKSPACE_COOKIE);
  expireSafariCookie(ACTIVE_STARTUP_ID_COOKIE);
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
    var id = localStorage.getItem(${JSON.stringify(ACTIVE_STARTUP_ID_KEY)}) || "";
    var raw = localStorage.getItem(${JSON.stringify(ACTIVE_WORKSPACE_STORAGE_KEY)});
    if (!id && raw) {
      var state = JSON.parse(raw);
      if (state && state.has_active_startup && state.active_startup_id) {
        id = String(state.active_startup_id);
      }
    }
    if (flag !== "true" && !id) return;
    var attrs = "Path=/; Max-Age=31536000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
    document.cookie = "${ACTIVE_WORKSPACE_FLAG_COOKIE}=true; " + attrs;
    document.cookie = "${HAS_ACTIVE_STARTUP_COOKIE}=1; " + attrs;
    if (id && id.indexOf("/") === -1 && id.indexOf("..") === -1) {
      var encoded = encodeURIComponent(id);
      document.cookie = "${ACTIVE_STARTUP_ID_COOKIE}=" + encoded + "; " + attrs;
      document.cookie = "${ACTIVE_WORKSPACE_COOKIE}=" + encoded + "; " + attrs;
      try { localStorage.setItem(${JSON.stringify(ACTIVE_STARTUP_ID_KEY)}, id); } catch (e) {}
      location.replace("/dashboard/workspace/" + encoded);
      return;
    }
    location.replace("/dashboard/workspace");
  } catch (e) {}
})();`;
