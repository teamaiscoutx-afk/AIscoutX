import { AnalyzeView } from "@/components/mvp/analyze-view";
import { getLatestVenturePack } from "@/app/actions/generation";
import { getUsageSnapshot } from "@/app/actions/usage";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const [pack, usage] = await Promise.all([
    getLatestVenturePack(),
    getUsageSnapshot(),
  ]);

  return <AnalyzeView pack={pack} usage={usage} />;
}
