import { ProLockScreen } from "@/components/billing/pro-lock-screen";
import { BlueprintsPageClient } from "@/components/mvp/blueprints-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";
import { requirePro } from "@/lib/billing/paywall";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const gate = await requirePro("blueprint");

  if (!gate.allowed) {
    return (
      <ProLockScreen
        title="Blueprints run on Pro"
        description="Tech stack, feature scoping, pricing structure, and the week-by-week roadmap — generated from live market evidence."
        bullets={[
          "Unlimited Generate Blueprint runs",
          "Must-have vs nice-to-have feature cuts",
          "Recommended stack with rationale for every layer",
        ]}
        reason={gate.reason}
      />
    );
  }

  const serverPack = await getLatestVenturePack();
  return <BlueprintsPageClient serverPack={serverPack} />;
}
