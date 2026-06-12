import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase";

export type SupabaseWriter = SupabaseClient<Database>;

/**
 * Prefer the service-role client for catalog writes (discovery feed upserts).
 * Migration 005 restricts opportunity inserts to service role for shared rows.
 * Falls back to the cookie session client for user-owned venture-pack rows.
 */
export function createCatalogWriterClient(): SupabaseWriter | null {
  const admin = createServiceRoleSupabaseClient();
  if (admin) return admin;

  try {
    return createServerSupabaseClient();
  } catch {
    return null;
  }
}

export function isRlsOrPermissionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("42501") ||
    lower.includes("new row violates")
  );
}
