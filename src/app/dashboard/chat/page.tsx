import { FounderChat } from "@/components/founder/founder-chat";
import { getUsageSnapshot } from "@/app/actions/usage";
import { getCurrentProfile } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const [usage, profile] = await Promise.all([
    getUsageSnapshot().catch(() => null),
    getCurrentProfile().catch(() => null),
  ]);

  const isPro = profile?.plan?.toLowerCase() === "pro";

  return <FounderChat usage={usage} isPro={isPro} />;
}