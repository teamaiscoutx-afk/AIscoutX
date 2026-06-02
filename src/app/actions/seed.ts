"use server";

import { revalidatePath } from "next/cache";

import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import { getSeedOpportunities } from "@/lib/seed/opportunity-seeds";
import {
  createServiceRoleSupabaseClient,
  isSupabaseConfigured,
  verifySupabaseConnection,
} from "@/lib/supabase";

export type SeedOpportunitiesResult = {
  ok: boolean;
  inserted: number;
  skipped: number;
  message: string;
};

export async function verifyDatabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    };
  }
  return verifySupabaseConnection();
}

/**
 * Inserts premium mock opportunities when the table is empty (or when force=true).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local for RLS bypass.
 */
export async function seedMockOpportunities(options?: {
  force?: boolean;
}): Promise<SeedOpportunitiesResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      message: "Supabase is not configured.",
    };
  }

  const admin = createServiceRoleSupabaseClient();
  if (!admin) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      message:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role).",
    };
  }

  const force = options?.force ?? false;

  const { count, error: countError } = await admin
    .from("opportunities")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      message: countError.message,
    };
  }

  if (!force && (count ?? 0) > 0) {
    return {
      ok: true,
      inserted: 0,
      skipped: count ?? 0,
      message: `Database already has ${count} opportunities. Pass force=true to add more.`,
    };
  }

  const seeds = getSeedOpportunities();
  const rows = seeds.map(mapOpportunityToInsertRow);

  const { error: insertError } = await admin.from("opportunities").insert(rows);

  if (insertError) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      message: insertError.message,
    };
  }

  revalidatePath("/dashboard");

  return {
    ok: true,
    inserted: rows.length,
    skipped: 0,
    message: `Inserted ${rows.length} premium opportunities.`,
  };
}
