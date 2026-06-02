import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase-env";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function redirectToLogin(origin: string, message: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (oauthError) {
    return redirectToLogin(origin, oauthError);
  }

  if (!code) {
    return redirectToLogin(origin, "Missing authorization code");
  }

  const env = getSupabaseEnv();
  if (!env) {
    return redirectToLogin(origin, "Auth configuration error");
  }

  const destination = new URL(nextPath, origin);
  let response = NextResponse.redirect(destination);

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.redirect(destination);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectToLogin(origin, error.message);
    }

    if (data.user) {
      await ensureUserProfile(supabase, data.user);
    }

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Authentication failed";
    return redirectToLogin(origin, message);
  }
}
