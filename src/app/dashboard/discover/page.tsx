import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";

import { loadCachedOpportunities } from "@/app/actions/intelligence";
import { fetchNotifications } from "@/app/actions/notifications";
import { getCurrentProfile } from "@/app/actions/profile";
import { resolveActiveWorkspace } from "@/app/actions/active-workspace";
import { IntelligenceSkeleton } from "@/components/dashboard/intelligence-skeleton";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { normalizeNicheForWorkspace } from "@/lib/dashboard/onboarding";
import { DiscoverRouteGuard } from "@/components/dashboard/discover-route-guard";
import {
  ACTIVE_STARTUP_ID_COOKIE,
  ACTIVE_WORKSPACE_COOKIE,
} from "@/lib/workspace/active-workspace";
import {
  hasActiveWorkspaceCookie,
  readActiveWorkspaceCookie,
} from "@/lib/workspace/active-workspace-server";

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
  const jar = cookies();
  const activeId =
    readActiveWorkspaceCookie() ??
    jar.get(ACTIVE_STARTUP_ID_COOKIE)?.value?.trim() ??
    jar.get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim();
  const accountWorkspace = await resolveActiveWorkspace();
  if (!wantsDiscover && (activeId || hasActiveWorkspaceCookie() || accountWorkspace)) {
    redirect(
      activeId
        ? `/dashboard/workspace/${decodeURIComponent(activeId)}`
        : accountWorkspace
          ? `/dashboard/workspace/${accountWorkspace.id}`
          : "/dashboard/workspace"
    );
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
      <DiscoverRouteGuard>
        <CommandCenter
          initialOpportunities={cached}
          dataSource={cached.length ? "cache" : "live"}
          initialNotifications={notifications}
          initialWorkspace={initialWorkspace}
          initialNiche={initialNiche}
          skipOnboarding={Boolean(profile?.onboarding_completed || accountWorkspace)}
        />
      </DiscoverRouteGuard>
    </Suspense>
  );
}
