import { CommandCenter } from "@/components/dashboard/command-center";
import { loadCachedOpportunities } from "@/app/actions/intelligence";
import { fetchNotifications, syncActiveWorkspaceSignals } from "@/app/actions/notifications";
import { getCurrentProfile } from "@/app/actions/profile";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { normalizeNicheForWorkspace } from "@/lib/dashboard/onboarding";

export const dynamic = "force-dynamic";
/** Live Tavily + OpenAI scans can exceed default serverless limits. */
export const maxDuration = 60;

export default async function DiscoverPage() {
  const profile = await getCurrentProfile();

  const initialWorkspace: WorkspaceIdentity =
    profile?.workspace_mode ?? "founder";
  const initialNiche: NicheId = normalizeNicheForWorkspace(
    initialWorkspace,
    profile?.current_niche
  );

  // Fast SSR: show cached live rows immediately; client triggers fresh live scan.
  const [, cached, notifications] = await Promise.all([
    syncActiveWorkspaceSignals(),
    loadCachedOpportunities(initialWorkspace, initialNiche),
    fetchNotifications(),
  ]);

  return (
    <CommandCenter
      initialOpportunities={cached}
      dataSource={cached.length ? "cache" : "live"}
      initialNotifications={notifications}
      initialWorkspace={initialWorkspace}
      initialNiche={initialNiche}
    />
  );
}
