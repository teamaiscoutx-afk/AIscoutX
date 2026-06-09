import { AnalyzeView } from "@/components/mvp/analyze-view";
import { VenturePackHydrator } from "@/components/mvp/venture-pack-hydrator";
import { getLatestVenturePack } from "@/app/actions/generation";
import { getUsageSnapshot } from "@/app/actions/usage";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const [serverPack, usage] = await Promise.all([
    getLatestVenturePack(),
    getUsageSnapshot(),
  ]);

  return (
    <VenturePackHydrator serverPack={serverPack}>
      {(pack) => <AnalyzeView pack={pack} usage={usage} />}
    </VenturePackHydrator>
  );
}
