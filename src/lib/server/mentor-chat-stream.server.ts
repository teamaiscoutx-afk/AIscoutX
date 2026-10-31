type MentorSseEvent =
  | { type: "meta"; creditsRemaining?: number; creditsAllowance?: number; warning?: string }
  | { type: "delta"; text: string }
  | { type: "done"; reply: string }
  | { type: "error"; error: string };

function encodeSse(event: MentorSseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

/** Converts Azure OpenAI SSE bytes into AIscoutX mentor SSE events. */
export function createMentorChatSseStream(input: {
  azureBody: ReadableStream<Uint8Array>;
  meta?: { creditsRemaining?: number; creditsAllowance?: number; warning?: string };
}): ReadableStream<Uint8Array> {
  const reader = input.azureBody.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";
  let metaSent = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (input.meta && !metaSent) {
        controller.enqueue(
          encodeSse({
            type: "meta",
            creditsRemaining: input.meta.creditsRemaining,
            creditsAllowance: input.meta.creditsAllowance,
            warning: input.meta.warning,
          })
        );
        metaSent = true;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const json = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                fullReply += delta;
                controller.enqueue(encodeSse({ type: "delta", text: delta }));
              }
            } catch {
              // Skip malformed stream chunks instead of hanging the connection.
            }
          }
        }

        const reply = fullReply.trim();
        if (!reply) {
          controller.enqueue(
            encodeSse({ type: "error", error: "Azure OpenAI returned an empty stream." })
          );
        } else {
          controller.enqueue(encodeSse({ type: "done", reply }));
        }
        controller.close();
      } catch (err) {
        controller.enqueue(
          encodeSse({
            type: "error",
            error: err instanceof Error ? err.message : "Stream interrupted.",
          })
        );
        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}
