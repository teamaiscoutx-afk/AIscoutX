import { NextResponse } from "next/server";

import {
  loadWorkspaceChats,
  saveWorkspaceChats,
  type PersistedMentorChat,
} from "@/app/actions/workspace-chats";

export const dynamic = "force-dynamic";

function workspaceIdFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Session cookie identifies the user. The client never supplies user id. */
export async function GET(request: Request) {
  const workspaceId = workspaceIdFrom(
    new URL(request.url).searchParams.get("workspaceId")
  );
  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "Missing workspace." }, { status: 400 });
  }

  const snapshot = await loadWorkspaceChats(workspaceId);
  if (!snapshot.ok) {
    return NextResponse.json({ ok: false, chats: [], activeChatId: "" }, { status: 401 });
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
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const workspaceId = workspaceIdFrom(body.workspaceId);
  const chats = Array.isArray(body.chats) ? body.chats : null;
  const activeChatId = typeof body.activeChatId === "string" ? body.activeChatId : "";
  if (!workspaceId || !chats) {
    return NextResponse.json({ ok: false, error: "Missing workspace or chats." }, { status: 400 });
  }

  const saved = await saveWorkspaceChats(workspaceId, chats, activeChatId);
  if (!saved.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
