import { BlueprintsPageClient } from "@/components/mvp/blueprints-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const serverPack = await getLatestVenturePack();
  return <BlueprintsPageClient serverPack={serverPack} />;
}
