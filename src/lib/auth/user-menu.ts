import {
  GOAL_OPTIONS,
  IDENTITY_OPTIONS,
  NICHE_FOCUS_OPTIONS,
  type CoreGoal,
  type NicheFocus,
  type WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import { getUserWorkspaces } from "@/app/actions/workspaces";
import { getCurrentProfile } from "@/app/actions/profile";
import { tryCreateServerSupabaseClient } from "@/lib/supabase";

export type UserMenuContext = {
  isAuthenticated: boolean;
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  persona: string | null;
  goal: string | null;
  nicheFocus: string | null;
  activeVenture: string;
  plan?: string | null;
  profile?: {
    plan?: string | null;
  } | null;
  user?: {
    user_metadata?: {
      plan?: string | null;
    };
  } | null;
};

function labelForPersona(id: WorkspaceIdentity | null | undefined): string | null {
  if (!id) return null;
  return IDENTITY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function labelForGoal(id: CoreGoal | null | undefined): string | null {
  if (!id) return null;
  return GOAL_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function labelForNicheFocus(id: NicheFocus | null | undefined): string | null {
  if (!id) return null;
  return NICHE_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function buildInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email[0] ?? "U").toUpperCase();
}

export async function getUserMenuContext(): Promise<UserMenuContext> {
  const supabase = tryCreateServerSupabaseClient();
  if (!supabase) {
    return {
      isAuthenticated: false,
      name: "Guest",
      email: "",
      initials: "G",
      avatarUrl: null,
      persona: null,
      goal: null,
      nicheFocus: null,
      activeVenture: "Exploring Opportunities",
      plan: "free",
      profile: { plan: "free" },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      name: "Guest",
      email: "",
      initials: "G",
      avatarUrl: null,
      persona: null,
      goal: null,
      nicheFocus: null,
      activeVenture: "Exploring Opportunities",
      plan: "free",
      profile: { plan: "free" },
    };
  }

  const profile = await getCurrentProfile();
  const workspaces = await getUserWorkspaces();
  const activeWorkspace = workspaces[0];

  const metaName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    null;

  const email = user.email ?? profile?.email ?? "";
  const name = metaName ?? email.split("@")[0] ?? "Founder";
  const avatarUrl =
    (typeof user.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url) ||
    null;

  const personaId = profile?.persona ?? profile?.workspace_mode ?? null;
  const goalId = profile?.goal ?? null;
  const nicheId = profile?.niche_focus ?? null;

  // 🎯 CRITICAL FIX: Extract user plan from profile OR user metadata
  const userPlan = (profile as any)?.plan || user.user_metadata?.plan || "free";

  return {
    isAuthenticated: true,
    name,
    email,
    initials: buildInitials(name, email),
    avatarUrl,
    persona: labelForPersona(personaId),
    goal: labelForGoal(goalId),
    nicheFocus: labelForNicheFocus(nicheId),
    activeVenture: activeWorkspace?.opportunityName ?? "Exploring Opportunities",
    plan: userPlan,
    profile: {
      plan: userPlan,
    },
    user: {
      user_metadata: {
        plan: userPlan,
      },
    },
  };
}