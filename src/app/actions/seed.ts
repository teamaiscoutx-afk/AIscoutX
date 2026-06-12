"use server";

import { revalidatePath } from "next/cache";

import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import {
  getSeedOpportunities,
  USER_BLUEPRINT_CATEGORY,
} from "@/lib/seed/opportunity-seeds";
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
      message:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    };
  }
  return verifySupabaseConnection();
}

/**
 * Inserts 6 premium global discovery opportunities when the feed is empty
 * (or when force=true replaces existing discovery rows).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local for RLS bypass.
 * Does NOT touch user blueprint rows (category = venture-pack).
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
    .select("*", { count: "exact", head: true })
    .neq("category", USER_BLUEPRINT_CATEGORY);

  if (countError) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      message: countError.message,
    };
  }

  const discoveryCount = count ?? 0;

  if (!force && discoveryCount > 0) {
    return {
      ok: true,
      inserted: 0,
      skipped: discoveryCount,
      message: `Discovery feed already has ${discoveryCount} opportunities. Pass force=true to replace them.`,
    };
  }

  if (force && discoveryCount > 0) {
    const { error: deleteError } = await admin
      .from("opportunities")
      .delete()
      .neq("category", USER_BLUEPRINT_CATEGORY);

    if (deleteError) {
      return {
        ok: false,
        inserted: 0,
        skipped: 0,
        message: deleteError.message,
      };
    }
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
  revalidatePath("/dashboard/discover");

  return {
    ok: true,
    inserted: rows.length,
    skipped: 0,
    message: `Inserted ${rows.length} premium global discovery opportunities.`,
  };
}
