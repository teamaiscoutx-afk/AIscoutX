import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import type { AuthMode } from "@/app/actions/auth";
import {
  isSupabaseConfigured,
  tryCreateServerSupabaseClient,
} from "@/lib/supabase";
import { getSupabaseEnv } from "@/lib/supabase-env";

type LoginPageProps = {
  searchParams?: {
    redirect?: string;
    error?: string;
    mode?: string;
  };
};

function parseAuthMode(value?: string): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

/**
 * Server-side env read (always fresh after restart) — passed to the client form
 * so the missing-env warning hides when `.env.local` is configured.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams?.redirect ?? "/dashboard";
  const initialMode = parseAuthMode(searchParams?.mode);
  const authError = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : undefined;

  const env = getSupabaseEnv();
  const authEnabled = isSupabaseConfigured();

  if (authEnabled) {
    const supabase = tryCreateServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
      }
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(222,255,154,0.1),transparent)]"
      />
      <LoginForm
        redirectTo={redirectTo}
        authError={authError}
        initialMode={initialMode}
        authEnabled={authEnabled}
        supabaseUrl={env?.url}
        supabaseAnonKey={env?.anonKey}
      />
      <Link
        href="/"
        className="relative mt-8 text-xs text-zinc-600 transition-colors hover:text-[#deff9a]"
      >
        ← Back to home
      </Link>
    </div>
  );
}
