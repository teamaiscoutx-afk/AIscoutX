import { NextResponse } from "next/server";

import { getCreditSnapshotForUser } from "@/lib/billing/credit-engine.server";
import { MONTHLY_CREDIT_ALLOWANCE } from "@/lib/billing/credit-plans";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

function nextResetIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export async function GET() {
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

  const snapshot = await getCreditSnapshotForUser(user.id);

  if (snapshot) {
    return NextResponse.json({
      ok: true,
      remaining: snapshot.remaining,
      allowance: snapshot.allowance,
      used: snapshot.used,
      bonus: 0,
      resetAt: snapshot.resetAt,
      bufferUsed: snapshot.bufferUsed,
      subscriptionTier: snapshot.subscriptionTier,
    });
  }

  // Legacy fallback when migration 010 is not applied yet
  let used = 0;
  const { data } = await supabase
    .from("usage_wallets")
    .select("chat_messages_this_month")
    .eq("user_id", user.id)
    .maybeSingle();

  if (typeof data?.chat_messages_this_month === "number") {
    used = Math.max(0, Math.min(MONTHLY_CREDIT_ALLOWANCE, data.chat_messages_this_month));
  }

  const remaining = MONTHLY_CREDIT_ALLOWANCE - used;

  return NextResponse.json({
    ok: true,
    remaining,
    allowance: MONTHLY_CREDIT_ALLOWANCE,
    used,
    bonus: 0,
    resetAt: nextResetIso(),
    bufferUsed: false,
    subscriptionTier: "free",
  });
}
