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

function mapPack(row: VenturePackRow): VenturePack {
  return {
    id: row.id,
    userId: row.user_id,
    query: row.query,
    analyze: row.analyze_json,
    blueprint: row.blueprint_json,
    launch: row.launch_json,
    createdAt: row.created_at,
  };
}

export async function generateVenturePack(query: string): Promise<{
  ok: boolean;
  packId?: string;
  error?: string;
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter what you're building to generate a blueprint." };
  }

  const gate = await checkBlueprintGeneration();
  if (!gate.allowed) {
    return { ok: false, error: gate.reason };
  }

  const { analyze, blueprint, launch } = runGenerationPipeline(trimmed);

  if (!isSupabaseConfigured()) {
    return { ok: true, packId: `demo-${Date.now()}` };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("venture_packs")
      .insert({
        user_id: user.id,
        query: trimmed,
        analyze_json: analyze,
        blueprint_json: blueprint,
        launch_json: launch,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Generation failed" };
    }

    await incrementBlueprintUsage();

    revalidatePath("/dashboard/analyze");
    revalidatePath("/dashboard/blueprints");
    revalidatePath("/dashboard/launch");

    return { ok: true, packId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return { ok: false, error: message };
  }
}

export async function getLatestVenturePack(): Promise<VenturePack | null> {
  if (!isSupabaseConfigured()) {
    const demo = runGenerationPipeline("AI SaaS for creators");
    return {
      id: "demo",
      userId: "demo",
      query: "AI SaaS for creators",
      analyze: demo.analyze,
      blueprint: demo.blueprint,
      launch: demo.launch,
      createdAt: new Date().toISOString(),
    };
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

    if (error || !data) return null;
    return mapPack(data);
  } catch {
    return null;
  }
}

export async function getVenturePackById(
  packId: string
): Promise<VenturePack | null> {
  if (!isSupabaseConfigured() || packId.startsWith("demo")) {
    return getLatestVenturePack();
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
    return mapPack(data);
  } catch {
    return null;
  }
}
