import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";

import { loadCachedOpportunities } from "@/app/actions/intelligence";
import { fetchNotifications } from "@/app/actions/notifications";
import { getCurrentProfile } from "@/app/actions/profile";
import { IntelligenceSkeleton } from "@/components/dashboard/intelligence-skeleton";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { normalizeNicheForWorkspace } from "@/lib/dashboard/onboarding";
import {
  ACTIVE_WORKSPACE_COOKIE,
} from "@/lib/workspace/active-workspace";

const CommandCenter = nextDynamic(
  () =>
    import("@/components/dashboard/command-center").then((mod) => mod.CommandCenter),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <IntelligenceSkeleton rows={10} />
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams?: { intent?: string };
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const wantsDiscover = searchParams?.intent === "discover";
  const activeId = cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim();
  if (activeId && !wantsDiscover) {
    redirect(`/dashboard/workspace/${decodeURIComponent(activeId)}`);
  }

  const profile = await getCurrentProfile();

  const initialWorkspace: WorkspaceIdentity =
    profile?.workspace_mode ?? "founder";
  const initialNiche: NicheId = normalizeNicheForWorkspace(
    initialWorkspace,
    profile?.current_niche
  );

  const [cached, notifications] = await Promise.all([
    loadCachedOpportunities(initialWorkspace, initialNiche),
    fetchNotifications(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <IntelligenceSkeleton rows={10} />
        </div>
      }
    >
      <CommandCenter
        initialOpportunities={cached}
        dataSource={cached.length ? "cache" : "live"}
        initialNotifications={notifications}
        initialWorkspace={initialWorkspace}
        initialNiche={initialNiche}
      />
    </Suspense>
  );
}
