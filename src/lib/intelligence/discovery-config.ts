/** Target number of opportunities per niche refresh. */
export const DISCOVERY_IDEA_TARGET = 10;

/** Live Tavily + OpenAI calls per sequential batch (rate-limit safe). */
export const DISCOVERY_CONCURRENCY = 2;

/** Pause between batches to avoid OpenAI/Tavily rate limits. */
export const DISCOVERY_BATCH_DELAY_MS = 1400;

/** Max seeds to hit via live APIs per refresh (pad remainder with structured fallback). */
export const DISCOVERY_LIVE_SEED_CAP = 6;

/** Per-seed live scan timeout. */
export const DISCOVERY_SEED_TIMEOUT_MS = 28_000;

/** Overall live batch budget before padding with structured fallback. */
export const DISCOVERY_BATCH_BUDGET_MS = 240_000;
