import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import {
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
  isSupabaseConfigured,
  type SupabaseEnv,
} from "@/lib/supabase-env";

export {
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
  isSupabaseConfigured,
  type SupabaseEnv,
};

function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local."
    );
  }
  return env;
}

/** Browser client — prefer importing from `@/lib/supabase/client` in Client Components */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

/** Server client — Server Components, Server Actions, Route Handlers (cookie session) */
export function createServerSupabaseClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail in Server Components when response is read-only
        }
      },
    },
  });
}

/**
 * Server client that returns null instead of throwing when env is missing.
 * Use for optional code paths (marketing pages, dev without Supabase).
 */
export function tryCreateServerSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

/** Route Handler client without cookie session — public inserts (e.g. waitlist) */
export function createRouteHandlerSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  return createSupabaseClient<Database>(env.url, env.anonKey);
}

/** Admin client for seeds/migrations — requires SUPABASE_SERVICE_ROLE_KEY */
export function createServiceRoleSupabaseClient() {
  const env = getSupabaseEnv();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!env || !serviceKey) {
    return null;
  }

  return createSupabaseClient<Database>(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Quick connectivity check for Server Actions / scripts */
export async function verifySupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const env = getSupabaseEnv();
  if (!env) {
    return {
      ok: false,
      message: "Supabase env vars are not set in .env.local",
    };
  }

  try {
    const client =
      createServiceRoleSupabaseClient() ??
      createSupabaseClient<Database>(env.url, env.anonKey);
    const { error } = await client.from("opportunities").select("id").limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Connected to Supabase successfully" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown connection error";
    return { ok: false, message };
  }
}
