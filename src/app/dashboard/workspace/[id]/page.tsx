import { notFound } from "next/navigation";

import { StartupWorkspaceView } from "@/components/founder/startup-workspace-view";
import { getWorkspaceById, getWorkspaceTasks } from "@/app/actions/workspaces";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  params: { id: string };
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const workspace = await getWorkspaceById(params.id);
  if (!workspace) notFound();

  const tasks = await getWorkspaceTasks(workspace.id);

  return (
    <StartupWorkspaceView initialWorkspace={workspace} initialTasks={tasks} />
  );
}
