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

async function lookupActiveWorkspaceId(
  supabase: ReturnType<typeof createServerClient<Database>>
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

  const wantsDiscover = request.nextUrl.searchParams.get("intent") === "discover";
  const isDiscoverEntry = pathname === "/dashboard/discover";
  const isDashboardRoot = pathname === "/dashboard";
  const wantsSignIn = request.nextUrl.searchParams.get("signin") === "1";
  const isEntry =
    (pathname === "/" && !wantsSignIn) ||
    isLogin ||
    isDashboardRoot ||
    (isDiscoverEntry && !wantsDiscover);

  if (user && isEntry) {
    const requested = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
    const specific =
      request.nextUrl.searchParams.get("redirect") &&
      requested !== "/dashboard" &&
      !requested.startsWith("/dashboard/discover");
    if (specific && (isLogin || pathname === "/")) {
      const url = request.nextUrl.clone();
      url.pathname = requested;
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }

    const dbId = await lookupActiveWorkspaceId(supabase);
    if (dbId) {
      return redirectToWorkspace(request, supabaseResponse, dbId);
    }

    if (isLogin || pathname === "/" || isDashboardRoot) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/discover";
      url.search = "intent=discover";
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
