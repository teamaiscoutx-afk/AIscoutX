import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { getIntelligenceEnvStatus } = await import(
    "../lib/intelligence/env"
  );
  const { refreshLiveOpportunityFeed } = await import(
    "../app/actions/intelligence"
  );

  const env = getIntelligenceEnvStatus();
  console.log("Env status:", env);

  if (!env.ready) {
    console.error("Keys not detected — check .env.local");
    process.exit(1);
  }

  console.log("Running live discovery for founder / b2b-saas …");
  const result = await refreshLiveOpportunityFeed("founder", "b2b-saas");
  console.log("Result:", {
    ok: result.ok,
    count: result.opportunities.length,
    error: result.error,
    sample: result.opportunities[0]?.name,
  });

  if (!result.ok || !result.opportunities.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
