#!/usr/bin/env node
/**
 * Sync server env vars from .env.local → Vercel (production + preview + development).
 *
 * Requires one-time login: npx vercel login
 * Or set VERCEL_TOKEN in the environment.
 *
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const SYNC_KEYS = [
  "OPENAI_API_KEY",
  "TAVILY_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

function parseEnvFile(content) {
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function runVercel(args, input) {
  const result = spawnSync("npx", ["vercel", ...args], {
    cwd: root,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return result;
}

function upsertEnv(key, value, target) {
  // Remove existing var (ignore errors), then add fresh value.
  runVercel(["env", "rm", key, target, "--yes"]);
  const add = runVercel(["env", "add", key, target], `${value}\n`);
  if (add.status !== 0) {
    console.error(`Failed ${key} (${target}):`, add.stderr || add.stdout);
    return false;
  }
  console.log(`✓ ${key} → ${target}`);
  return true;
}

const raw = readFileSync(envPath, "utf8");
const env = parseEnvFile(raw);

const link = runVercel(["link", "--yes"]);
if (link.status !== 0) {
  console.error(
    "Vercel project not linked. Run: npx vercel login && npx vercel link"
  );
  console.error(link.stderr || link.stdout);
  process.exit(1);
}

let ok = 0;
let skipped = 0;

for (const key of SYNC_KEYS) {
  const value = env.get(key)?.trim();
  if (!value) {
    console.warn(`⊘ Skipping ${key} (empty in .env.local)`);
    skipped += 1;
    continue;
  }
  for (const target of ["production", "preview", "development"]) {
    if (upsertEnv(key, value, target)) ok += 1;
  }
}

console.log(`\nDone: ${ok} vars synced, ${skipped} skipped.`);
if (skipped > 0) {
  console.log(
    "\nAdd missing keys to .env.local (especially SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API)."
  );
}
