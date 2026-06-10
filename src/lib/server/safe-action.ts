/**
 * Safe error handling for Server Actions and Route Handlers.
 * Logs full detail server-side; returns clean payloads to the client
 * without leaking stack traces, env vars, or internal table names.
 */

export type ActionError = {
  ok: false;
  error: string;
  code?: string;
};

export type ActionSuccess<T> = { ok: true } & T;

export type ActionResult<T> = ActionSuccess<T> | ActionError;

const GENERIC_MESSAGE = "Something went wrong. Try again in a moment.";

/** Patterns that should never reach the client. */
const SENSITIVE_PATTERNS = [
  /supabase/i,
  /postgres/i,
  /pgrst/i,
  /jwt/i,
  /api[_-]?key/i,
  /service[_-]?role/i,
  /env/i,
  /ECONN/,
  /fetch failed/i,
];

function isSafeMessage(message: string): boolean {
  return !SENSITIVE_PATTERNS.some((p) => p.test(message));
}

export function logServerError(scope: string, err: unknown): void {
  const detail =
    err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  console.error(`[${scope}]`, detail);
}

/**
 * Convert any thrown value into a client-safe error payload.
 * Pass `clientMessage` to override; otherwise known-safe messages pass through.
 */
export function toClientError(
  scope: string,
  err: unknown,
  clientMessage?: string,
  code?: string
): ActionError {
  logServerError(scope, err);

  if (clientMessage) {
    return { ok: false, error: clientMessage, code };
  }

  const raw = err instanceof Error ? err.message : "";
  return {
    ok: false,
    error: raw && isSafeMessage(raw) ? raw : GENERIC_MESSAGE,
    code,
  };
}

/** Wrap an async action body with logging + clean error payloads. */
export async function safeAction<T>(
  scope: string,
  fn: () => Promise<ActionResult<T>>,
  clientMessage?: string
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    return toClientError(scope, err, clientMessage);
  }
}
