import { cookies } from "next/headers";

import {
  ACTIVE_WORKSPACE_COOKIE,
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
  } catch {
    // Cookie writes can fail outside a request context.
  }
}
