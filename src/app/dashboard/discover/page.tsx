import { CommandCenter } from "@/components/dashboard/command-center";
import { fetchAllOpportunities } from "@/app/actions/opportunities";
import { getCurrentProfile } from "@/app/actions/profile";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getDefaultNicheForIdentity } from "@/lib/dashboard/onboarding";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const profile = await getCurrentProfile();
  const { opportunities, source } = await fetchAllOpportunities();

  const initialWorkspace: WorkspaceIdentity =
    profile?.workspace_mode ?? "founder";
  const initialNiche: NicheId =
    (profile?.current_niche as NicheId | undefined) ??
    getDefaultNicheForIdentity(initialWorkspace).id;

  return (
    <CommandCenter
      initialOpportunities={opportunities}
      dataSource={source}
      initialWorkspace={initialWorkspace}
      initialNiche={initialNiche}
    />
  );
}
