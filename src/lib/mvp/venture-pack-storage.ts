import type { VenturePack } from "@/lib/mvp/types";

const PACK_KEY = "aiscoutx_venture_pack";
const BLUEPRINT_MONTH_KEY = "aiscoutx_blueprints_month";

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function saveVenturePackLocal(pack: VenturePack): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PACK_KEY, JSON.stringify(pack));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

export function loadVenturePackLocal(): VenturePack | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PACK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VenturePack;
  } catch {
    return null;
  }
}

export function clearVenturePackLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PACK_KEY);
}

/** Client-side blueprint counter when Supabase usage_wallets is unavailable. */
export function getLocalBlueprintCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(BLUEPRINT_MONTH_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { month: string; count: number };
    return parsed.month === monthKey() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

export function incrementLocalBlueprintCount(): void {
  if (typeof window === "undefined") return;
  const month = monthKey();
  const count = getLocalBlueprintCount() + 1;
  localStorage.setItem(BLUEPRINT_MONTH_KEY, JSON.stringify({ month, count }));
}

