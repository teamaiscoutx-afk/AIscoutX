import { redirect } from "next/navigation";

import { resolveActiveWorkspace } from "@/app/actions/active-workspace";
import { writeActiveWorkspaceCookie } from "@/lib/workspace/active-workspace-server";

export default async function ActiveWorkspaceIndexPage() {
  const active = await resolveActiveWorkspace();

  if (active) {
    writeActiveWorkspaceCookie(active.id);
    redirect(`/dashboard/workspace/${active.id}`);
  }

  redirect("/dashboard/discover?intent=discover");
}
