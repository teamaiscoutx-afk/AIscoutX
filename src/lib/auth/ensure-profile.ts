import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

export async function ensureUserProfile(
  supabase: Supabase,
  user: User,
  overrides?: {
    workspace_mode?: WorkspaceIdentity;
    current_niche?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      workspace_mode: overrides?.workspace_mode ?? "founder",
      persona: overrides?.workspace_mode ?? "founder",
      current_niche: overrides?.current_niche ?? "b2b-saas",
      niche_focus: "ai",
      goal: "build-startup",
      onboarding_completed: false,
      plan: "free",
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
