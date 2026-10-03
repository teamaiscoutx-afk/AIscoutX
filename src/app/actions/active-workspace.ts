"use server";

import {
  getUserWorkspaces,
  getWorkspaceById,
} from "@/app/actions/workspaces";
import { writeActiveWorkspaceCookie } from "@/lib/workspace/active-workspace-server";
import type { StartupWorkspace } from "@/lib/founder/types";

export async function markWorkspaceActiveSession(
  workspaceId: string
): Promise<{ ok: boolean }> {
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) return { ok: false };
  writeActiveWorkspaceCookie(workspace.id);
  return { ok: true };
}

export async function resolveActiveWorkspace(): Promise<StartupWorkspace | null> {
  const workspaces = await getUserWorkspaces();
  if (!workspaces.length) return null;
  return workspaces.find((item) => item.isActive) ?? workspaces[0] ?? null;
}
