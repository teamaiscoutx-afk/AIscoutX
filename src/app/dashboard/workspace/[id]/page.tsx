import { StartupWorkspaceView } from "@/components/founder/startup-workspace-view";
import { notFound } from "next/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const workspace = { id: params.id, summary: { name: "Workspace" } } as any;
  const tasks: any[] = [];

  return (
    <div className="fixed inset-0 z-50 bg-[#040407] overflow-hidden">
      <StartupWorkspaceView initialWorkspace={workspace} initialTasks={tasks} />
    </div>
  );
}