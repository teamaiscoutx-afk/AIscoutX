import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import {
  getSeedOpportunities,
  USER_BLUEPRINT_CATEGORY,
} from "@/lib/seed/opportunity-seeds";
import {
  createServiceRoleSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

/** Premium in-memory catalog — keeps the dashboard populated for Stripe review. */
export function getCuratedDiscoveryFallback(): Opportunity[] {
  return getSeedOpportunities();
}

/**
 * One-time DB seed when the shared discovery catalog is empty.
 * Requires SUPABASE_SERVICE_ROLE_KEY (migration 005 blocks anon inserts).
 */
export async function tryBootstrapDiscoveryCatalog(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const admin = createServiceRoleSupabaseClient();
  if (!admin) return 0;

  const { count, error: countError } = await admin
    .from("opportunities")
    .select("*", { count: "exact", head: true })
    .neq("category", USER_BLUEPRINT_CATEGORY);

  if (countError || (count ?? 0) > 0) return 0;

  const rows = getSeedOpportunities().map(mapOpportunityToInsertRow);
  const { error: insertError } = await admin.from("opportunities").insert(rows);

  return insertError ? 0 : rows.length;
}
