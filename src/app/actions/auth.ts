"use server";

import { redirect } from "next/navigation";

import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export type AuthActionState = {
  error?: string;
  success?: string;
  /** Set when email auth established a session — client should router.push */
  authenticated?: boolean;
  redirectTo?: string;
};

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getRedirectPath(formData: FormData): string {
  const path = String(formData.get("redirect") ?? "/dashboard").trim();
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

/**
 * Sign in existing users, or create account + profile for new emails.
 * Redirects to dashboard when a session is established.
 */
export async function continueWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars to .env.local." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getRedirectPath(formData);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createServerSupabaseClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (!signInError && signInData.user) {
    const profileResult = await ensureUserProfile(supabase, signInData.user);
    if (!profileResult.ok) {
      return { error: profileResult.error ?? "Could not sync profile." };
    }
    return { authenticated: true, redirectTo };
  }

  const signInMessage = signInError?.message?.toLowerCase() ?? "";
  const shouldTrySignUp =
    signInMessage.includes("invalid login") ||
    signInMessage.includes("invalid credentials") ||
    signInMessage.includes("user not found");

  if (!shouldTrySignUp && signInError) {
    return { error: signInError.message };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (signUpError) {
    if (
      signUpError.message.toLowerCase().includes("already registered") ||
      signUpError.message.toLowerCase().includes("already exists")
    ) {
      return { error: "Account exists — check your password and try again." };
    }
    return { error: signUpError.message };
  }

  if (signUpData.user) {
    await ensureUserProfile(supabase, signUpData.user);
  }

  if (signUpData.session && signUpData.user) {
    return { authenticated: true, redirectTo };
  }

  return {
    success:
      "Account created. Check your email to confirm, then sign in — or disable email confirmation in Supabase for instant access.",
  };
}

export async function signInWithEmail(
  prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  return continueWithEmail(prev, formData);
}

export async function signUpWithEmail(
  prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  return continueWithEmail(prev, formData);
}

export async function signInWithGoogle(formData?: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect(
      `/login?error=${encodeURIComponent("Supabase is not configured.")}`
    );
  }

  const redirectTo = formData
    ? getRedirectPath(formData)
    : "/dashboard";

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=Could%20not%20start%20Google%20sign-in");
}

/** Form action wrapper for Google OAuth button */
export async function signInWithGoogleAction(
  formData: FormData
): Promise<void> {
  await signInWithGoogle(formData);
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
