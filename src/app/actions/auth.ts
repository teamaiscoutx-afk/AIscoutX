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

export type AuthMode = "signin" | "signup";

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

function parseCredentials(formData: FormData): {
  email: string;
  password: string;
  redirectTo: string;
  error?: string;
} {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getRedirectPath(formData);

  if (!email || !password) {
    return { email, password, redirectTo, error: "Email and password are required." };
  }

  if (password.length < 8) {
    return {
      email,
      password,
      redirectTo,
      error: "Password must be at least 8 characters.",
    };
  }

  return { email, password, redirectTo };
}

function normalizeSignInError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

function normalizeSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("already exist")
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }
  return message;
}

/** Sign in existing users only — never attempts registration. */
export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars to .env.local." };
  }

  const parsed = parseCredentials(formData);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    return { error: normalizeSignInError(error.message) };
  }

  if (!data.user) {
    return { error: "Sign-in failed. Please try again." };
  }

  const profileResult = await ensureUserProfile(supabase, data.user);
  if (!profileResult.ok) {
    return { error: profileResult.error ?? "Could not sync profile." };
  }

  return { authenticated: true, redirectTo: parsed.redirectTo };
}

/** Register new users only — never attempts sign-in. */
export async function signUpWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars to .env.local." };
  }

  const parsed = parseCredentials(formData);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(parsed.redirectTo)}`,
    },
  });

  if (error) {
    return { error: normalizeSignUpError(error.message) };
  }

  if (data.user) {
    await ensureUserProfile(supabase, data.user);
  }

  if (data.session && data.user) {
    return { authenticated: true, redirectTo: parsed.redirectTo };
  }

  return {
    success:
      "Account created. Check your email to confirm, then sign in — or disable email confirmation in Supabase for instant access.",
  };
}

export async function signInWithGoogle(formData?: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect(
      `/login?error=${encodeURIComponent("Supabase is not configured.")}`
    );
  }

  const redirectTo = formData ? getRedirectPath(formData) : "/dashboard";

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
