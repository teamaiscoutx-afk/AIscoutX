"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

/** Read NEXT_PUBLIC_* vars inlined by Next (client bundle). */
export function getClientSupabaseEnv(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function createBrowserSupabaseClient(
  config?: PublicSupabaseConfig | null
) {
  const env = config ?? getClientSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server."
    );
  }

  return createBrowserClient<Database>(env.url, env.anonKey);
}

export function tryCreateBrowserSupabaseClient(
  config?: PublicSupabaseConfig | null
): ReturnType<typeof createBrowserSupabaseClient> | null {
  try {
    return createBrowserSupabaseClient(config);
  } catch {
    return null;
  }
}
