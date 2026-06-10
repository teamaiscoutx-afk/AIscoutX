import { ProLockScreen } from "@/components/billing/pro-lock-screen";
import { FounderGpsPage } from "@/components/founder/founder-gps-page";
import { requirePro } from "@/lib/billing/paywall";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

export const dynamic = "force-dynamic";

export default async function GpsPage() {
  const gate = await requirePro("gps");

  if (!gate.allowed) {
    return (
      <ProLockScreen
        title="Founder GPS runs on Pro"
        description="Track validation, MVP, launch, and sales scores across every venture — updated automatically as market momentum shifts."
        bullets={[
          "Live progress scoring across 4 execution vectors",
          "Auto-generated next actions for each stage",
          "Scores adjust with real market signals from your niche",
        ]}
        reason={gate.reason}
      />
    );
  }

  const { workspaces, tasksByWorkspace } = await loadPhaseData();
  return (
    <FounderGpsPage workspaces={workspaces} tasksByWorkspace={tasksByWorkspace} />
  );
}
