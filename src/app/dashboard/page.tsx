import { CommandCenter } from "@/components/dashboard/command-center";
import { fetchAllOpportunities } from "@/app/actions/opportunities";
import { getCurrentProfile } from "@/app/actions/profile";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getDefaultNicheForIdentity } from "@/lib/dashboard/onboarding";

export const dynamic = "force-dynamic";

/**
 * Server Component — loads all opportunities from Supabase once,
 * then hands off to CommandCenter for live filtering & drawer UX.
 */
export default async function DashboardPage() {
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
