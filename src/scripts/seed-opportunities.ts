import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Seed premium mock opportunities into Supabase.
 *
 * Usage:
 *   npm run seed:opportunities
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import { getSeedOpportunities } from "@/lib/seed/opportunity-seeds";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { count, error: countError } = await supabase
    .from("opportunities")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Count failed:", countError.message);
    process.exit(1);
  }

  if ((count ?? 0) > 0) {
    console.log(
      `Skipping seed: ${count} opportunities already exist. Delete rows or truncate table to re-seed.`
    );
    process.exit(0);
  }

  const seeds = getSeedOpportunities();
  const rows = seeds.map(mapOpportunityToInsertRow);

  const { error: insertError } = await supabase.from("opportunities").insert(rows);

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${rows.length} opportunities into Supabase.`);
  seeds.forEach((s) => console.log(`  · ${s.name}`));
}

main();
