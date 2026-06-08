import { PhaseWorkspacePage } from "@/components/founder/phase-workspace-page";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  const { workspaces, tasksByWorkspace } = await loadPhaseData();

  return (
    <PhaseWorkspacePage
      stage="launch"
      title="Launch"
      description="Execute your GTM motion and get your first users in-market."
      workspaces={workspaces}
      tasksByWorkspace={tasksByWorkspace}
    />
  );
}
