import { AnalyzePageClient } from "@/components/mvp/analyze-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";
import { getUsageSnapshot } from "@/app/actions/usage";
import { sanitizeUsageSnapshot } from "@/lib/billing/usage-serialize";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const [serverPack, usage] = await Promise.all([
    getLatestVenturePack(),
    getUsageSnapshot(),
  ]);

  return (
    <AnalyzePageClient
      serverPack={serverPack}
      usage={sanitizeUsageSnapshot(usage)}
    />
  );
}
