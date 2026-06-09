import { FounderGpsPage } from "@/components/founder/founder-gps-page";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function GpsPage() {
  const { workspaces, tasksByWorkspace } = await loadPhaseData();
  return (
    <FounderGpsPage workspaces={workspaces} tasksByWorkspace={tasksByWorkspace} />
  );
}
