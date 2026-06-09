import { BlueprintsView } from "@/components/mvp/blueprints-view";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const pack = await getLatestVenturePack();
  return <BlueprintsView pack={pack} />;
}
