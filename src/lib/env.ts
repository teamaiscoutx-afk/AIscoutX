/** Trimmed server env read — ignores empty strings, whitespace, and surrounding quotes. */
export function readServerEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;

  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed.length > 0 ? trimmed : undefined;
}

/** Prefer server-only keys; fall back to legacy NEXT_PUBLIC_* names when misconfigured. */
export function readIntelligenceEnv(name: string): string | undefined {
  return readServerEnv(name) ?? readServerEnv(`NEXT_PUBLIC_${name}`);
}
