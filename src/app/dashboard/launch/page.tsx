import { LaunchPageClient } from "@/components/mvp/launch-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function LaunchPlanPage() {
  const serverPack = await getLatestVenturePack();
  return <LaunchPageClient serverPack={serverPack} />;
}
