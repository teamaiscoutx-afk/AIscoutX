import { NextResponse } from "next/server";

import type { PersistedMentorChat } from "@/lib/mentor/workspace-chat-types";
import {
  loadWorkspaceChatsSecure,
  saveWorkspaceChatsSecure,
} from "@/lib/server/workspace-chats.server";

export const dynamic = "force-dynamic";

function workspaceIdFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const workspaceId = workspaceIdFrom(
    new URL(request.url).searchParams.get("workspaceId")
  );
  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "Missing workspace." }, { status: 400 });
  }

  const snapshot = await loadWorkspaceChatsSecure(workspaceId);
  if (!snapshot.ok) {
    return NextResponse.json(
      {
        ok: false,
        chats: [],
        activeChatId: "",
        error: snapshot.error ?? "Failed to load chats.",
      },
      { status: snapshot.error === "Sign in required." ? 401 : 500 }
    );
  }

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  let body: {
    workspaceId?: unknown;
    chats?: PersistedMentorChat[];
    activeChatId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const workspaceId = workspaceIdFrom(body.workspaceId);
  const chats = Array.isArray(body.chats) ? body.chats : null;
  const activeChatId = typeof body.activeChatId === "string" ? body.activeChatId : "";
  if (!workspaceId || !chats) {
    return NextResponse.json({ ok: false, error: "Missing workspace or chats." }, { status: 400 });
  }

  const saved = await saveWorkspaceChatsSecure(workspaceId, chats, activeChatId);
  if (!saved.ok) {
    const unauthorized =
      saved.error === "Sign in required." || saved.error?.includes("Workspace not found");
    return NextResponse.json(
      { ok: false, error: saved.error ?? "Failed to save chats." },
      { status: unauthorized ? 401 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
