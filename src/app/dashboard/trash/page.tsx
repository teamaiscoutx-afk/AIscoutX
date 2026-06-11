import type { Metadata } from "next";

import { getTrashItems } from "@/app/actions/trash";
import { TrashView } from "@/components/dashboard/trash-view";

export const metadata: Metadata = {
  title: "Trash / Bin — AIscoutX",
  description: "Recover or permanently delete projects and blueprints.",
};

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const items = await getTrashItems();

  return <TrashView initialItems={items} />;
}
