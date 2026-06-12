import nextDynamic from "next/dynamic";

import { ProLockScreen } from "@/components/billing/pro-lock-screen";
import { requirePro } from "@/lib/billing/paywall";
import { loadPhaseData } from "@/lib/founder/load-phase-data";

const FounderGpsPage = nextDynamic(
  () =>
    import("@/components/founder/founder-gps-page").then((mod) => mod.FounderGpsPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
        Loading Founder GPS…
      </div>
    ),
  }
);

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
