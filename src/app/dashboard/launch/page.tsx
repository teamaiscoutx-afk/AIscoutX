import { LaunchView } from "@/components/mvp/launch-view";
import { VenturePackHydrator } from "@/components/mvp/venture-pack-hydrator";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function LaunchPlanPage() {
  const serverPack = await getLatestVenturePack();

  return (
    <VenturePackHydrator serverPack={serverPack}>
      {(pack) => <LaunchView pack={pack} />}
    </VenturePackHydrator>
  );
}
