import { ProLockScreen } from "@/components/billing/pro-lock-screen";
import { LaunchPageClient } from "@/components/mvp/launch-page-client";
import { getLatestVenturePack } from "@/app/actions/generation";
import { requirePro } from "@/lib/billing/paywall";

export const dynamic = "force-dynamic";

export default async function LaunchPlanPage() {
  const gate = await requirePro("blueprint");

  if (!gate.allowed) {
    return (
      <ProLockScreen
        title="Launch Plans run on Pro"
        description="Platform playbooks for Reddit, X, LinkedIn, and Product Hunt — plus outreach scripts ready to paste."
        bullets={[
          "Channel-specific launch playbooks",
          "Sample posts written in your product's voice",
          "Cold email and DM scripts that get replies",
        ]}
        reason={gate.reason}
      />
    );
  }

  const serverPack = await getLatestVenturePack();
  return <LaunchPageClient serverPack={serverPack} />;
}
