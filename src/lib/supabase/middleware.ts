import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase-env";

/** Forward session cookies set during `getUser()` onto redirect responses. */
function applyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie);
  });
}

function safeRedirectPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLogin =
    pathname === "/login" ||
    pathname === "/sign-in" ||
    pathname === "/log-in";
  const isAuthCallback = pathname.startsWith("/auth/");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("signin", "1");
    url.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && isLogin) {
    const redirectTo = safeRedirectPath(
      request.nextUrl.searchParams.get("redirect")
    );
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && pathname === "/") {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    if (redirectTo) {
      const url = request.nextUrl.clone();
      url.pathname = safeRedirectPath(redirectTo);
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }

    const wantsSignIn = request.nextUrl.searchParams.get("signin") === "1";
    if (!wantsSignIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
  }

  if (isAuthCallback) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
