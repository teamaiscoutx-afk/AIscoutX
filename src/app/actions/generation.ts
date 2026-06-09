"use server";

import { revalidatePath } from "next/cache";

import {
  checkBlueprintGeneration,
  incrementBlueprintUsage,
} from "@/app/actions/usage";
import { runGenerationPipeline } from "@/lib/mvp/generation-pipeline";
import type { VenturePack } from "@/lib/mvp/types";
import type { VenturePackRow } from "@/lib/database.types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

function mapPack(row: VenturePackRow, userId: string): VenturePack {
  return {
    id: row.id,
    userId: row.user_id ?? userId,
    query: row.query,
    analyze: row.analyze_json,
    blueprint: row.blueprint_json,
    launch: row.launch_json,
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
    lower.includes("venture_packs") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("pgrst205")
  );
}

export type GenerateVenturePackResult = {
  ok: boolean;
  pack?: VenturePack;
  storageMode?: "database" | "local";
  error?: string;
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

  const gate = await checkBlueprintGeneration();
  if (!gate.allowed) {
    return { ok: false, error: gate.reason };
  }

  if (!isSupabaseConfigured()) {
    try {
      const pack = await buildPack(trimmed, "demo");
      return { ok: true, pack, storageMode: "local" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      return { ok: false, error: message };
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
      .from("venture_packs")
      .insert({
        user_id: user.id,
        query: trimmed,
        analyze_json: pack.analyze,
        blueprint_json: pack.blueprint,
        launch_json: pack.launch,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: true, pack, storageMode: "local" };
      }
      return { ok: false, error: error.message };
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
      pack: mapPack(data, user.id),
      storageMode: "database",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    if (isMissingTableError(message)) {
      try {
        const pack = await buildPack(trimmed, "local");
        return { ok: true, pack, storageMode: "local" };
      } catch (buildErr) {
        const buildMessage =
          buildErr instanceof Error ? buildErr.message : "Generation failed";
        return { ok: false, error: buildMessage };
      }
    }
    return { ok: false, error: message };
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
      .from("venture_packs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) return null;
      return null;
    }
    if (!data) return null;
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
      .from("venture_packs")
      .select("*")
      .eq("id", packId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return mapPack(data, user.id);
  } catch {
    return null;
  }
}
