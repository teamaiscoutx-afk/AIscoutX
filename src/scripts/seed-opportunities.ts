import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Seed premium global discovery opportunities into Supabase.
 *
 * Usage:
 *   npm run seed:opportunities
 *   npm run seed:opportunities -- --force
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { mapOpportunityToInsertRow } from "@/lib/dashboard/opportunity-mapper";
import {
  getSeedOpportunities,
  USER_BLUEPRINT_CATEGORY,
} from "@/lib/seed/opportunity-seeds";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const force = process.argv.includes("--force");

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
    .select("*", { count: "exact", head: true })
    .neq("category", USER_BLUEPRINT_CATEGORY);

  if (countError) {
    console.error("Count failed:", countError.message);
    process.exit(1);
  }

  const discoveryCount = count ?? 0;

  if (!force && discoveryCount > 0) {
    console.log(
      `Skipping seed: ${discoveryCount} discovery opportunities already exist. Run with --force to replace.`
    );
    process.exit(0);
  }

  if (force && discoveryCount > 0) {
    const { error: deleteError } = await supabase
      .from("opportunities")
      .delete()
      .neq("category", USER_BLUEPRINT_CATEGORY);

    if (deleteError) {
      console.error("Delete failed:", deleteError.message);
      process.exit(1);
    }
    console.log(`Removed ${discoveryCount} existing discovery rows.`);
  }

  const seeds = getSeedOpportunities();
  const rows = seeds.map(mapOpportunityToInsertRow);

  const { error: insertError } = await supabase.from("opportunities").insert(rows);

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${rows.length} global discovery opportunities.`);
  seeds.forEach((s) => console.log(`  · ${s.name} (${s.category}, score ${s.score})`));
}

main();
