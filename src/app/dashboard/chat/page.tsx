import { FounderChat } from "@/components/founder/founder-chat";
import { getUsageSnapshot } from "@/app/actions/usage";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const usage = await getUsageSnapshot();
  return <FounderChat usage={usage} />;
}
