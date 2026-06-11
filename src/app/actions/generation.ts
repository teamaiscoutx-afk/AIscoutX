"use server";

import { revalidatePath } from "next/cache";

import { incrementBlueprintUsage } from "@/app/actions/usage";
import { requirePro } from "@/lib/billing/paywall";
import { toClientError } from "@/lib/server/safe-action";
import { runGenerationPipeline } from "@/lib/mvp/generation-pipeline";
import type { VenturePack } from "@/lib/mvp/types";
import type { OpportunityRow } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

/** Venture packs live on the shared `opportunities` table under this category. */
const VENTURE_PACK_CATEGORY = "venture-pack";

/** PostgREST JSON path to the pack owner inside mode_data. */
const PACK_OWNER_COLUMN = "mode_data->venturePack->>ownerId";

function mapPack(row: OpportunityRow, userId: string): VenturePack | null {
  const data = row.mode_data?.venturePack;
  if (!data) return null;
  return {
    id: row.id,
    userId: data.ownerId ?? userId,
    query: data.query ?? row.title,
    analyze: data.analyze,
    blueprint: data.blueprint,
    launch: data.launch,
    createdAt: row.created_at,
  };
}

async function buildPack(query: string, userId: string): Promise<VenturePack> {
  const { analyze, blueprint, launch } = await runGenerationPipeline(query);
  return {
    id: `pack-${Date.now()}`,
    userId,
    query,
    analyze,
    blueprint,
    launch,
    createdAt: new Date().toISOString(),
  };
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("opportunities") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("pgrst205") ||
    lower.includes("row-level security")
  );
}

export type GenerateVenturePackResult = {
  ok: boolean;
  pack?: VenturePack;
  storageMode?: "database" | "local";
  error?: string;
  code?: string;
};

export async function generateVenturePack(
  query: string
): Promise<GenerateVenturePackResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Enter what you're building to generate a blueprint.",
    };
  }

  const gate = await requirePro("blueprint");
  if (!gate.allowed) {
    return { ok: false, error: gate.reason, code: gate.code };
  }

  if (!isSupabaseConfigured()) {
    try {
      const pack = await buildPack(trimmed, "demo");
      return { ok: true, pack, storageMode: "local" };
    } catch (err) {
      return toClientError("generation.buildPack", err);
    }
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? "local";
    const pack = await buildPack(trimmed, userId);

    if (!user) {
      return { ok: true, pack, storageMode: "local" };
    }

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        title: trimmed,
        category: VENTURE_PACK_CATEGORY,
        mode_data: {
          venturePack: {
            ownerId: user.id,
            query: trimmed,
            analyze: pack.analyze,
            blueprint: pack.blueprint,
            launch: pack.launch,
          },
        },
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: true, pack, storageMode: "local" };
      }
      return toClientError(
        "generation.insert",
        new Error(error.message),
        "Could not save your blueprint. Try again."
      );
    }

    if (!data) {
      return { ok: true, pack, storageMode: "local" };
    }

    await incrementBlueprintUsage().catch(() => undefined);

    revalidatePath("/dashboard/analyze");
    revalidatePath("/dashboard/blueprints");
    revalidatePath("/dashboard/launch");

    return {
      ok: true,
      pack: mapPack(data, user.id) ?? pack,
      storageMode: "database",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    if (isMissingTableError(message)) {
      try {
        const pack = await buildPack(trimmed, "local");
        return { ok: true, pack, storageMode: "local" };
      } catch (buildErr) {
        return toClientError("generation.fallback", buildErr);
      }
    }
    return toClientError("generation.run", err);
  }
}

export async function getLatestVenturePack(): Promise<VenturePack | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("category", VENTURE_PACK_CATEGORY)
      .eq(PACK_OWNER_COLUMN, user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapPack(data, user.id);
  } catch {
    return null;
  }
}

export async function getVenturePackById(
  packId: string
): Promise<VenturePack | null> {
  if (!isSupabaseConfigured() || packId.startsWith("local-")) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", packId)
      .eq("category", VENTURE_PACK_CATEGORY)
      .eq(PACK_OWNER_COLUMN, user.id)
      .maybeSingle();

    if (error || !data) return null;
    return mapPack(data, user.id);
  } catch {
    return null;
  }
}
