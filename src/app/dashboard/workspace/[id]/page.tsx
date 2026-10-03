import { notFound } from "next/navigation";

import { getWorkspaceById, getWorkspaceTasks } from "@/app/actions/workspaces";
import { StartupWorkspaceView } from "@/components/founder/startup-workspace-view";
import { writeActiveWorkspaceCookie } from "@/lib/workspace/active-workspace-server";
import type { StartupWorkspace } from "@/lib/founder/types";

function fallbackWorkspace(id: string): StartupWorkspace {
  return {
    id,
    userId: "",
    opportunityId: null,
    opportunityName: "VoiceCraft",
    summary: {
      overview: {
        tagline: "Your active startup workspace",
        problem: "",
        solution: "",
        targetCustomer: "",
      },
      validation: { hypotheses: [], proofSignals: [], interviewQuestions: [] },
      competitors: { players: [], marketGap: "" },
      mvp: { mustHave: [], mustNot: [], roadmap: [] },
      launch: { channels: [], first30Days: [], messaging: "" },
      revenue: { tiers: [], pricingModel: "" },
    },
    currentStage: "validate",
    validationScore: 0,
    mvpScore: 0,
    launchScore: 0,
    salesScore: 0,
    isActive: true,
    nicheFocus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function WorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const workspaceId = params.id?.trim();
  if (!workspaceId) notFound();

  const [workspace, tasks] = await Promise.all([
    getWorkspaceById(workspaceId),
    getWorkspaceTasks(workspaceId).catch(() => []),
  ]);

  const resolved = workspace ?? fallbackWorkspace(workspaceId);
  writeActiveWorkspaceCookie(resolved.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#09090B]">
      <StartupWorkspaceView initialWorkspace={resolved} initialTasks={tasks} />
    </div>
  );
}
