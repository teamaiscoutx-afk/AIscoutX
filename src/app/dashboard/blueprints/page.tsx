import { BlueprintsPageClient } from "@/components/mvp/blueprints-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";
import { getUsageSnapshot } from "@/app/actions/usage";
import { sanitizeUsageSnapshot } from "@/lib/billing/usage-serialize";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const [serverPack, usage] = await Promise.all([
    getLatestVenturePack(),
    getUsageSnapshot(),
  ]);

  return (
    <BlueprintsPageClient
      serverPack={serverPack}
      usage={sanitizeUsageSnapshot(usage)}
    />
  );
}
