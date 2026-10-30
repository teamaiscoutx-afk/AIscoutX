/**
 * Production connectivity diagnostics for Azure OpenAI, Azure AI Search, and Razorpay.
 * Usage: npm run verify:env
 */
import { config } from "dotenv";

config({ path: ".env.local" });

import {
  readAzureOpenAIConfig,
  readAzureSearchIndexName,
} from "../src/lib/azure-ai";
import { readIntelligenceEnv } from "../src/lib/env";

type CheckResult = {
  service: string;
  ok: boolean;
  message: string;
  durationMs: number;
};

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function mask(value: string | undefined, visible = 4): string {
  if (!value) return "(missing)";
  if (value.length <= visible) return "***";
  return `${value.slice(0, 3)}…${value.slice(-visible)}`;
}

function logResult(result: CheckResult): void {
  const icon = result.ok ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
  console.log(`${icon}  ${result.service}  ${DIM}(${result.durationMs}ms)${RESET}`);
  console.log(`       ${result.message}\n`);
}

async function verifyAzureOpenAI(): Promise<CheckResult> {
  const started = Date.now();
  const cfg = readAzureOpenAIConfig();
  if (!cfg) {
    return {
      service: "Azure OpenAI",
      ok: false,
      message:
        "Missing AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, or AZURE_OPENAI_DEPLOYMENT_NAME in .env.local",
      durationMs: Date.now() - started,
    };
  }

  const url = `${cfg.endpoint}/openai/deployments/${encodeURIComponent(cfg.deployment)}/chat/completions?api-version=${encodeURIComponent(cfg.apiVersion)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cfg.apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 8,
        temperature: 0,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      return {
        service: "Azure OpenAI",
        ok: false,
        message: `HTTP ${response.status} — ${raw.slice(0, 280)}`,
        durationMs: Date.now() - started,
      };
    }

    let parsed: { choices?: { message?: { content?: string } }[] };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return {
        service: "Azure OpenAI",
        ok: false,
        message: "Endpoint responded but body was not valid JSON.",
        durationMs: Date.now() - started,
      };
    }

    const reply = parsed.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      service: "Azure OpenAI",
      ok: true,
      message: `Deployment "${cfg.deployment}" @ ${cfg.endpoint} — chat OK (reply: "${reply.slice(0, 40)}")`,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return {
      service: "Azure OpenAI",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  }
}

async function verifyAzureSearch(): Promise<CheckResult> {
  const started = Date.now();
  const endpoint = readIntelligenceEnv("AZURE_SEARCH_ENDPOINT")?.replace(/\/$/, "");
  const apiKey = readIntelligenceEnv("AZURE_SEARCH_API_KEY");
  const indexName = readAzureSearchIndexName();
  const apiVersion = readIntelligenceEnv("AZURE_SEARCH_API_VERSION") || "2023-11-01";

  if (!endpoint || !apiKey || !indexName) {
    return {
      service: "Azure AI Search",
      ok: false,
      message:
        "Missing AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_API_KEY, or index name (AZURE_SEARCH_INDEX_NAME).",
      durationMs: Date.now() - started,
    };
  }

  const url = `${endpoint}/indexes/${encodeURIComponent(indexName)}/docs/search?api-version=${encodeURIComponent(apiVersion)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        search: "*",
        top: 1,
        queryType: "simple",
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      let extra = "";
      if (response.status === 404) {
        try {
          const listUrl = `${endpoint}/indexes?api-version=${encodeURIComponent(apiVersion)}`;
          const listRes = await fetch(listUrl, {
            headers: { "api-key": apiKey },
          });
          if (listRes.ok) {
            const listData = (await listRes.json()) as {
              value?: { name?: string }[];
            };
            const names = (listData.value ?? [])
              .map((i) => i.name)
              .filter(Boolean)
              .slice(0, 8);
            extra = names.length
              ? ` Credentials OK. Indexes in service: ${names.join(", ")}. Set AZURE_SEARCH_INDEX_NAME accordingly.`
              : " Credentials OK but no indexes found — create one in Azure Portal.";
          }
        } catch {
          /* ignore list failure */
        }
      }
      return {
        service: "Azure AI Search",
        ok: false,
        message: `HTTP ${response.status} on index "${indexName}" — ${raw.slice(0, 200)}.${extra}`,
        durationMs: Date.now() - started,
      };
    }

    let parsed: { value?: unknown[] };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return {
        service: "Azure AI Search",
        ok: false,
        message: "Search endpoint responded but body was not valid JSON.",
        durationMs: Date.now() - started,
      };
    }

    const hitCount = parsed.value?.length ?? 0;
    return {
      service: "Azure AI Search",
      ok: true,
      message: `Index "${indexName}" @ ${endpoint} — search OK (${hitCount} doc(s) in sample query)`,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const base = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? ` (${err.cause.message})`
        : "";
    const hint =
      base.includes("fetch failed") || cause.includes("ENOTFOUND")
        ? " Check AZURE_SEARCH_ENDPOINT / AZURE_SEARCH_INDEX_NAME are on separate lines in .env.local."
        : "";
    return {
      service: "Azure AI Search",
      ok: false,
      message: `${base}${cause}${hint}`,
      durationMs: Date.now() - started,
    };
  }
}

async function verifyRazorpay(): Promise<CheckResult> {
  const started = Date.now();
  const keyId = readIntelligenceEnv("RAZORPAY_KEY_ID");
  const keySecret = readIntelligenceEnv("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return {
      service: "Razorpay",
      ok: false,
      message: "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local",
      durationMs: Date.now() - started,
    };
  }

  try {
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

    await client.orders.all({ count: 1 });

    const pub = readIntelligenceEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID");
    const pubMatch = !pub || pub === keyId;

    return {
      service: "Razorpay",
      ok: true,
      message: `API auth OK (key_id ${mask(keyId)}).${
        pubMatch ? "" : " Warning: NEXT_PUBLIC_RAZORPAY_KEY_ID does not match RAZORPAY_KEY_ID."
      }`,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      service: "Razorpay",
      ok: false,
      message: `Authentication or API error — ${msg.slice(0, 320)}`,
      durationMs: Date.now() - started,
    };
  }
}

async function verifyRazorpayOrderCreate(): Promise<CheckResult> {
  const started = Date.now();
  const keyId = readIntelligenceEnv("RAZORPAY_KEY_ID");
  const keySecret = readIntelligenceEnv("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return {
      service: "Razorpay order.create",
      ok: false,
      message: "Skipped — Razorpay keys missing.",
      durationMs: Date.now() - started,
    };
  }

  try {
    const { createRazorpayCheckoutOrder } = await import(
      "../src/lib/billing/razorpay-checkout.server"
    );

    const order = await createRazorpayCheckoutOrder({
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        email: "verify-env@aiscoutx.local",
        app_metadata: {},
        user_metadata: { full_name: "Env Verify" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as import("@supabase/supabase-js").User,
      plan: "monthly",
    });

    return {
      service: "Razorpay order.create",
      ok: Boolean(order.orderId),
      message: order.orderId
        ? `Created test order ${order.orderId} (${order.currency} ${order.amount}) — cancel/unpaid in Razorpay dashboard if needed.`
        : "Order response missing orderId.",
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return {
      service: "Razorpay order.create",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  }
}

async function main(): Promise<void> {
  console.log("\n AIscoutX — production key diagnostics\n");
  console.log(`${DIM}Loaded .env.local from ${process.cwd()}${RESET}\n`);

  const results: CheckResult[] = [];

  results.push(await verifyAzureOpenAI());
  logResult(results[results.length - 1]!);

  results.push(await verifyAzureSearch());
  logResult(results[results.length - 1]!);

  results.push(await verifyRazorpay());
  logResult(results[results.length - 1]!);

  results.push(await verifyRazorpayOrderCreate());
  logResult(results[results.length - 1]!);

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log("─".repeat(52));
  if (failed === 0) {
    console.log(`${GREEN}All ${passed} checks passed.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${failed} failed${RESET}, ${passed} passed.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal:${RESET}`, err);
  process.exit(1);
});
