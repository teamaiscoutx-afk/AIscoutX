import { LaunchView } from "@/components/mvp/launch-view";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function LaunchPlanPage() {
  const pack = await getLatestVenturePack();
  return <LaunchView pack={pack} />;
}
