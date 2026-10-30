import { NextResponse } from "next/server";

import { ensureWelcomeCreditsForUser } from "@/lib/billing/credit-engine.server";
import { getCreditSnapshotForUser } from "@/lib/billing/credit-engine.server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** POST /api/onboarding/welcome — idempotent freemium welcome credits on first session. */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await ensureWelcomeCreditsForUser(user.id);
  const credits = await getCreditSnapshotForUser(user.id);

  return NextResponse.json({
    ok: true,
    credits,
  });
}
