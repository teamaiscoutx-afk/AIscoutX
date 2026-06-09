import { BlueprintsView } from "@/components/mvp/blueprints-view";
import { VenturePackHydrator } from "@/components/mvp/venture-pack-hydrator";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const serverPack = await getLatestVenturePack();

  return (
    <VenturePackHydrator serverPack={serverPack}>
      {(pack) => <BlueprintsView pack={pack} />}
    </VenturePackHydrator>
  );
}
