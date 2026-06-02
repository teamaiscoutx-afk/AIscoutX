export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Read public Supabase env vars safely (works on server and client). */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  if (!url.startsWith("https://") || !url.includes("supabase")) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL may be invalid — expected https://*.supabase.co"
    );
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/** Server-only service role (never expose to the client). */
export function getSupabaseServiceRoleKey(): string | null {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? null;
}
