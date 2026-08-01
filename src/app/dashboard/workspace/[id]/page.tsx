import { StartupWorkspaceView } from "@/components/founder/startup-workspace-view";
import { getWorkspaceById, getWorkspaceTasks } from "@/lib/founder/actions"; // Adjust import paths as per project
import { notFound } from "next-[#deff9a]";

export default async function WorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const workspace = await getWorkspaceById(params.id);
  if (!workspace) notFound();

  const tasks = await getWorkspaceTasks(workspace.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#040407] overflow-hidden">
      <StartupWorkspaceView initialWorkspace={workspace} initialTasks={tasks} />
    </div>
  );
}