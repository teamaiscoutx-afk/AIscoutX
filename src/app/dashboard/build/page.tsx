import { PhaseWorkspacePage } from "@/components/founder/phase-workspace-page";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const { workspaces, tasksByWorkspace } = await loadPhaseData();

  return (
    <PhaseWorkspacePage
      stage="build"
      title="Build"
      description="Ship the MVP slice that unlocks your first paying customer."
      workspaces={workspaces}
      tasksByWorkspace={tasksByWorkspace}
    />
  );
}
