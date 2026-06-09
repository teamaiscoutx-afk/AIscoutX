import { CommandCenter } from "@/components/dashboard/command-center";
import { fetchAllOpportunities } from "@/app/actions/opportunities";
import { fetchNotifications, syncActiveWorkspaceSignals } from "@/app/actions/notifications";
import { getCurrentProfile } from "@/app/actions/profile";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getDefaultNicheForIdentity } from "@/lib/dashboard/onboarding";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const profile = await getCurrentProfile();

  const initialWorkspace: WorkspaceIdentity =
    profile?.workspace_mode ?? "founder";
  const initialNiche: NicheId =
    (profile?.current_niche as NicheId | undefined) ??
    getDefaultNicheForIdentity(initialWorkspace).id;

  const [, feed, notifications] = await Promise.all([
    syncActiveWorkspaceSignals(),
    fetchAllOpportunities(initialWorkspace, initialNiche),
    fetchNotifications(),
  ]);

  const { opportunities, source, statusMessage } = feed;

  return (
    <CommandCenter
      initialOpportunities={opportunities}
      dataSource={source}
      statusMessage={statusMessage}
      initialNotifications={notifications}
      initialWorkspace={initialWorkspace}
      initialNiche={initialNiche}
    />
  );
}
