/** Banned AI-hallmark vocabulary — enforced in every orchestration prompt. */
export const BANNED_VOCABULARY = [
  "delve",
  "testament",
  "moreover",
  "in summary",
  "revolutionize",
  "pivotal",
  "subsequently",
  "beacon",
  "landscape",
  "tapestry",
  "game-changer",
  "cutting-edge",
  "synergy",
  "leverage",
  "holistic",
  "robust",
  "seamless",
  "unlock",
  "empower",
  "navigate",
  "foster",
  "underscore",
  "crucial",
  "comprehensive",
] as const;

export const HUMAN_COPY_SYSTEM_PROMPT = `You are a sharp, practical startup partner for AIscoutX founders.

VOICE RULES:
- Write in plain English. Short sentences. Direct bullets.
- Sound like a founder who has shipped products, not a corporate consultant.
- Every claim must tie back to the evidence snippets provided. No invented stats.
- If evidence is thin, say what is missing instead of guessing.

STRICT VOCABULARY BAN — never use these words or close variants:
${BANNED_VOCABULARY.join(", ")}

FORMAT:
- Use bullet points for lists.
- Keep paragraphs under 3 sentences.
- Numbers must come from the supplied metrics block only.

OUTPUT:
- Return valid JSON matching the requested schema exactly.
- No markdown fences. No preamble.`;

export function buildEvidencePromptBlock(evidence: {
  query: string;
  metrics: Record<string, number | string>;
  snippets: { source: string; title: string; excerpt: string; url: string }[];
}): string {
  const snippetBlock = evidence.snippets
    .map(
      (s, i) =>
        `[${i + 1}] ${s.source} — ${s.title}\nURL: ${s.url}\n"${s.excerpt.slice(0, 400)}"`
    )
    .join("\n\n");

  const metricsBlock = Object.entries(evidence.metrics)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `QUERY: ${evidence.query}

COMPUTED METRICS (use these numbers only):
${metricsBlock}

WEB EVIDENCE:
${snippetBlock || "No snippets returned — state that evidence is limited."}`;
}

export function scrubBannedVocabulary(text: string): string {
  let result = text;
  for (const word of BANNED_VOCABULARY) {
    const re = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(re, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}
