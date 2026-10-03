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

function cookieValue(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value?.trim();
}

function decodeId(raw?: string): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded || decoded.includes("/") || decoded.includes("..")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function isStrictlyInactive(request: NextRequest): boolean {
  const has = cookieValue(request, "aiscoutx_has_active_startup");
  const flag = cookieValue(request, "aiscoutx_active_workspace");
  return has === "0" || has === "false" || flag === "false";
}

function readActiveStartupId(request: NextRequest): string | null {
  if (isStrictlyInactive(request)) return null;
  return (
    decodeId(cookieValue(request, "active_startup_id")) ??
    decodeId(cookieValue(request, "aiscoutx_active_startup"))
  );
}

function hasActiveWorkspaceSignal(request: NextRequest): boolean {
  if (isStrictlyInactive(request)) return false;
  if (cookieValue(request, "aiscoutx_active_workspace") === "true") return true;
  if (cookieValue(request, "aiscoutx_has_active_startup") === "1") return true;
  if (cookieValue(request, "active_startup_id")) return true;
  if (cookieValue(request, "aiscoutx_active_startup")) return true;
  return false;
}

function stampWorkspaceCookies(
  response: NextResponse,
  request: NextRequest,
  id?: string | null
) {
  const secure = request.nextUrl.protocol === "https:";
  const options = {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax" as const,
    secure,
    httpOnly: false,
  };
  response.cookies.set("aiscoutx_active_workspace", "true", options);
  response.cookies.set("aiscoutx_has_active_startup", "1", options);
  if (id) {
    response.cookies.set("active_startup_id", id, options);
    response.cookies.set("aiscoutx_active_startup", id, options);
  }
}

function redirectToWorkspace(
  request: NextRequest,
  supabaseResponse: NextResponse,
  id?: string | null
) {
  const url = request.nextUrl.clone();
  url.pathname = id ? `/dashboard/workspace/${id}` : "/dashboard/workspace";
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  applyCookies(supabaseResponse, redirectResponse);
  stampWorkspaceCookies(redirectResponse, request, id);
  return redirectResponse;
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
      if (isStrictlyInactive(request)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/discover";
        url.search = "";
        const redirectResponse = NextResponse.redirect(url);
        applyCookies(supabaseResponse, redirectResponse);
        return redirectResponse;
      }
      return redirectToWorkspace(request, supabaseResponse, readActiveStartupId(request));
    }
  }

  const wantsDiscover = request.nextUrl.searchParams.get("intent") === "discover";
  const isDiscoverEntry = pathname === "/dashboard/discover";
  const isDashboardRoot = pathname === "/dashboard";

  if (user && isDashboardRoot) {
    if (isStrictlyInactive(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/discover";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
    return redirectToWorkspace(request, supabaseResponse, readActiveStartupId(request));
  }

  if (user && isDiscoverEntry && !wantsDiscover && hasActiveWorkspaceSignal(request)) {
    return redirectToWorkspace(request, supabaseResponse, readActiveStartupId(request));
  }

  if (isAuthCallback) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
