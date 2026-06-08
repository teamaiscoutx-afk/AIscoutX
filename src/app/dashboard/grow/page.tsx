import { PhaseWorkspacePage } from "@/components/founder/phase-workspace-page";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function GrowPage() {
  const { workspaces, tasksByWorkspace } = await loadPhaseData();

  return (
    <PhaseWorkspacePage
      stage="grow"
      title="Grow"
      description="Turn traction into repeatable revenue and scale what works."
      workspaces={workspaces}
      tasksByWorkspace={tasksByWorkspace}
    />
  );
}
