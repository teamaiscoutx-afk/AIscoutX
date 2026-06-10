import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { Database } from "@/lib/database.types";
import { sendWelcomeEmail } from "@/lib/email";
import { logServerError } from "@/lib/server/safe-action";

type Supabase = SupabaseClient<Database>;

export async function ensureUserProfile(
  supabase: Supabase,
  user: User,
  overrides?: {
    workspace_mode?: WorkspaceIdentity;
    current_niche?: string;
  }
): Promise<{ ok: boolean; error?: string; isNewUser?: boolean }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const isNewUser = !existing;

  if (isNewUser) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      workspace_mode: overrides?.workspace_mode ?? "founder",
      persona: overrides?.workspace_mode ?? "founder",
      current_niche: overrides?.current_niche ?? "b2b-saas",
      niche_focus: "ai",
      goal: "build-startup",
      onboarding_completed: false,
      plan: "free",
    });

    // Race with the DB signup trigger is fine — ignore duplicate key
    if (error && error.code !== "23505") {
      return { ok: false, error: error.message };
    }
  } else if (overrides) {
    // Existing users: never touch plan / subscription_status here
    const { error } = await supabase
      .from("profiles")
      .update({
        workspace_mode: overrides.workspace_mode ?? undefined,
        current_niche: overrides.current_niche ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  if (isNewUser && user.email) {
    // Fire-and-forget welcome email — never block the auth flow
    sendWelcomeEmail(user.email).catch((err) =>
      logServerError("email.welcome", err)
    );
  }

  return { ok: true, isNewUser };
}
