import { PhaseWorkspacePage } from "@/components/founder/phase-workspace-page";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function ValidatePage() {
  const { workspaces, tasksByWorkspace } = await loadPhaseData();

  return (
    <PhaseWorkspacePage
      stage="validate"
      title="Validate"
      description="Prove demand with real customer signals before you build more."
      workspaces={workspaces}
      tasksByWorkspace={tasksByWorkspace}
    />
  );
}
