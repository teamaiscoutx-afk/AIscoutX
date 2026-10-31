export type MentorChatRequestBody = {
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
  workspaceId?: string;
  workspaceName?: string;
  founderName?: string;
  nicheLabel?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

export type MentorChatResult = {
  reply: string;
  warning?: string;
  streamUsed: boolean;
};

const CLIENT_TIMEOUT_MS = 90_000;

async function readJsonResponse(response: Response): Promise<{
  ok?: boolean;
  reply?: string;
  error?: string;
  warning?: string;
}> {
  try {
    return (await response.json()) as {
      ok?: boolean;
      reply?: string;
      error?: string;
      warning?: string;
    };
  } catch {
    return { ok: false, error: "Invalid response from mentor API." };
  }
}

function formatReply(reply: string, warning?: string): string {
  return warning ? `${warning}\n\n${reply}` : reply;
}

async function consumeMentorSse(
  body: ReadableStream<Uint8Array>,
  handlers: {
    onDelta?: (chunk: string, fullSoFar: string) => void;
  }
): Promise<{ reply: string; warning?: string; error?: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let warning: string | undefined;
  let terminalError: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;

      const payload = line.slice(5).trim();
      if (!payload) continue;

      try {
        const event = JSON.parse(payload) as {
          type?: string;
          text?: string;
          reply?: string;
          error?: string;
          warning?: string;
        };

        if (event.type === "meta" && event.warning) {
          warning = event.warning;
        } else if (event.type === "delta" && event.text) {
          full += event.text;
          handlers.onDelta?.(event.text, full);
        } else if (event.type === "done" && event.reply) {
          full = event.reply;
        } else if (event.type === "error" && event.error) {
          terminalError = event.error;
        }
      } catch {
        // Ignore malformed SSE frames.
      }
    }
  }

  return { reply: full.trim(), warning, error: terminalError };
}

async function parseJsonMentorResponse(response: Response): Promise<MentorChatResult> {
  const payload = await readJsonResponse(response);

  if (!response.ok || !payload.ok || !payload.reply) {
    throw new Error(
      payload.error ??
        (response.status === 402
          ? "You are out of credits. Choose a plan to continue mentor chat."
          : "Mentor is temporarily unavailable. Try again in a moment.")
    );
  }

  return {
    reply: formatReply(payload.reply, payload.warning),
    warning: payload.warning,
    streamUsed: false,
  };
}

export async function requestMentorChatReply(
  body: MentorChatRequestBody,
  handlers: {
    onDelta?: (chunk: string, fullSoFar: string) => void;
  } = {}
): Promise<MentorChatResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  const post = (stream: boolean) =>
    fetch(stream ? "/api/ai/chat?stream=1" : "/api/ai/chat", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: stream ? "text/event-stream, application/json" : "application/json",
      },
      body: JSON.stringify({ ...body, stream }),
      signal: controller.signal,
    });

  try {
    const streamResponse = await post(true);
    const contentType = streamResponse.headers.get("content-type") ?? "";

    if (
      streamResponse.ok &&
      contentType.includes("text/event-stream") &&
      streamResponse.body
    ) {
      const streamed = await consumeMentorSse(streamResponse.body, handlers);

      if (streamed.error && !streamed.reply) {
        throw new Error(streamed.error);
      }

      if (streamed.reply) {
        return {
          reply: formatReply(streamed.reply, streamed.warning),
          warning: streamed.warning,
          streamUsed: true,
        };
      }
    }

    if (
      streamResponse.ok &&
      contentType.includes("application/json")
    ) {
      return parseJsonMentorResponse(streamResponse);
    }

    if (!streamResponse.ok) {
      return parseJsonMentorResponse(streamResponse);
    }

    return parseJsonMentorResponse(await post(false));
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Mentor request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
