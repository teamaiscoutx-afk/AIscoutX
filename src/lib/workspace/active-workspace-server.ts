import { cookies, headers } from "next/headers";

import {
  ACTIVE_STARTUP_ID_COOKIE,
  ACTIVE_WORKSPACE_COOKIE,
  ACTIVE_WORKSPACE_FLAG_COOKIE,
  COOKIE_MAX_AGE,
  HAS_ACTIVE_STARTUP_COOKIE,
} from "@/lib/workspace/active-workspace";

function cookieSecure(): boolean {
  try {
    const proto = headers().get("x-forwarded-proto") ?? headers().get("x-forwarded-protocol");
    if (proto) return proto.split(",")[0]?.trim() === "https";
  } catch {
    // headers() unavailable outside a request.
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return site.startsWith("https://");
}

function safariCookieOptions() {
  return {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    httpOnly: false,
  };
}

function decodeCookie(value?: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded || decoded.includes("/") || decoded.includes("..")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function readActiveWorkspaceCookie(): string | null {
  try {
    const jar = cookies();
    return (
      decodeCookie(jar.get(ACTIVE_STARTUP_ID_COOKIE)?.value) ??
      decodeCookie(jar.get(ACTIVE_WORKSPACE_COOKIE)?.value)
    );
  } catch {
    return null;
  }
}

export function hasActiveWorkspaceCookie(): boolean {
  try {
    const jar = cookies();
    const flag = jar.get(ACTIVE_WORKSPACE_FLAG_COOKIE)?.value?.trim();
    const has = jar.get(HAS_ACTIVE_STARTUP_COOKIE)?.value?.trim();
    if (flag === "false" || has === "false" || has === "0") return false;
    return (
      flag === "true" ||
      has === "1" ||
      Boolean(readActiveWorkspaceCookie())
    );
  } catch {
    return false;
  }
}

export function clearActiveWorkspaceCookie(): void {
  try {
    const jar = cookies();
    const options = { path: "/", maxAge: 0 };
    jar.set(ACTIVE_STARTUP_ID_COOKIE, "", options);
    jar.set(ACTIVE_WORKSPACE_COOKIE, "", options);
    jar.set(HAS_ACTIVE_STARTUP_COOKIE, "", options);
    jar.set(ACTIVE_WORKSPACE_FLAG_COOKIE, "", options);
  } catch {
    // Cookie writes can fail outside a request context.
  }
}

export function writeActiveWorkspaceCookie(workspaceId: string): void {
  try {
    const jar = cookies();
    const options = safariCookieOptions();
    jar.set(ACTIVE_STARTUP_ID_COOKIE, workspaceId, options);
    jar.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, options);
    jar.set(HAS_ACTIVE_STARTUP_COOKIE, "1", options);
    jar.set(ACTIVE_WORKSPACE_FLAG_COOKIE, "true", options);
  } catch {
    // Cookie writes can fail outside a request context.
  }
}
