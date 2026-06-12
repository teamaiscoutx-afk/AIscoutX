import { NextResponse } from "next/server";

import { seedMockOpportunities } from "@/app/actions/seed";
import { logServerError } from "@/lib/server/safe-action";

export const dynamic = "force-dynamic";

/**
 * One-time admin endpoint to pre-populate the global discovery feed.
 *
 * POST /api/admin/seed-opportunities
 * Header: Authorization: Bearer <SEED_SECRET>
 * Body (optional JSON): { "force": true }
 *
 * Set SEED_SECRET in .env.local before invoking.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.SEED_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "SEED_SECRET is not configured. Add it to .env.local and restart the dev server.",
        },
        { status: 503 }
      );
    }

    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (token !== secret) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    let force = false;
    try {
      const body = (await request.json()) as { force?: boolean };
      force = body.force === true;
    } catch {
      // Empty body is fine — default force=false
    }

    const result = await seedMockOpportunities({ force });
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    logServerError("admin.seedOpportunities", err);
    return NextResponse.json(
      { ok: false, message: "Seed failed unexpectedly." },
      { status: 500 }
    );
  }
}
