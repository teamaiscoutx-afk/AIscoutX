/** Plain-English messages for common failures — no jargon for end users. */
export function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("fetch failed") || msg.includes("network")) {
      return "We couldn't reach the server. Check your connection and try again.";
    }
    if (msg.includes("jwt") || msg.includes("session")) {
      return "Your session expired. Please sign in again.";
    }
    if (msg.includes("permission") || msg.includes("rls")) {
      return "You don't have access to do that right now.";
    }
    if (err.message.length < 120) return err.message;
  }
  return fallback;
}
