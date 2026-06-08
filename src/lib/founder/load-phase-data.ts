import { getWorkspaceTasks, getUserWorkspaces } from "@/app/actions/workspaces";
import type { DailyTask } from "@/lib/founder/types";

export async function loadPhaseData() {
  const workspaces = await getUserWorkspaces();
  const tasksByWorkspace: Record<string, DailyTask[]> = {};

  await Promise.all(
    workspaces.map(async (workspace) => {
      tasksByWorkspace[workspace.id] = await getWorkspaceTasks(workspace.id);
    })
  );

  return { workspaces, tasksByWorkspace };
}
