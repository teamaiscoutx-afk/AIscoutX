import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { writeActiveWorkspaceCookie } from "@/lib/workspace/active-workspace-server";

type AppSupabase = SupabaseClient<Database>;

export function isGenericAppEntry(path: string): boolean {
  const pathname = path.split("?")[0];
  return (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname === "/dashboard/discover" ||
    pathname === "/login" ||
    pathname === "/sign-in" ||
    pathname === "/log-in"
  );
}

/** Active workspace for this auth user, preferring the row marked active. */
export async function findActiveWorkspaceId(
  supabase: AppSupabase
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, is_active")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data?.length) return null;
  return data.find((row) => row.is_active)?.id ?? data[0]?.id ?? null;
}

export async function pathAfterAuth(
  supabase: AppSupabase,
  requested = "/dashboard"
): Promise<string> {
  const workspaceId = await findActiveWorkspaceId(supabase);
  if (!workspaceId) {
    return isGenericAppEntry(requested)
      ? "/dashboard/discover?intent=discover"
      : requested;
  }

  writeActiveWorkspaceCookie(workspaceId);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);
  }

  if (!isGenericAppEntry(requested) && requested.startsWith("/dashboard/workspace/")) {
    return requested;
  }
  if (!isGenericAppEntry(requested)) return requested;
  return `/dashboard/workspace/${workspaceId}`;
}
