import { cookies } from "next/headers";

import {
  ACTIVE_WORKSPACE_COOKIE,
  ACTIVE_WORKSPACE_FLAG_COOKIE,
  HAS_ACTIVE_STARTUP_COOKIE,
} from "@/lib/workspace/active-workspace";

export function readActiveWorkspaceCookie(): string | null {
  try {
    const jar = cookies();
    const value = jar.get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim();
    if (!value) return null;
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function hasActiveWorkspaceCookie(): boolean {
  try {
    const jar = cookies();
    const flag = jar.get(ACTIVE_WORKSPACE_FLAG_COOKIE)?.value;
    const has = jar.get(HAS_ACTIVE_STARTUP_COOKIE)?.value;
    if (flag === "false" || has === "false" || has === "0") return false;
    return flag === "true" || has === "1" || Boolean(jar.get(ACTIVE_WORKSPACE_COOKIE)?.value);
  } catch {
    return false;
  }
}

export function writeActiveWorkspaceCookie(workspaceId: string): void {
  try {
    const jar = cookies();
    const options = {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax" as const,
      httpOnly: false,
    };
    jar.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, options);
    jar.set(HAS_ACTIVE_STARTUP_COOKIE, "1", options);
    jar.set(ACTIVE_WORKSPACE_FLAG_COOKIE, "true", options);
  } catch {
    // Cookie writes can fail outside a request context.
  }
}
