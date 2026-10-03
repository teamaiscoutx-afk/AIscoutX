import { cookies } from "next/headers";

import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace/active-workspace";

export function readActiveWorkspaceCookie(): string | null {
  try {
    const value = cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim();
    if (!value) return null;
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function writeActiveWorkspaceCookie(workspaceId: string): void {
  try {
    cookies().set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } catch {
    // Cookie writes can fail outside a request context.
  }
}
