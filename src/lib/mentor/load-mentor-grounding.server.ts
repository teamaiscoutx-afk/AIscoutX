import { getWorkspaceById } from "@/app/actions/workspaces";
import { loadWorkspaceChats } from "@/app/actions/workspace-chats";
import {
  buildWorkspaceChatMemoryDigest,
  detectLanguageStyleHint,
  formatWorkspaceBlueprintContext,
  mergeActiveThreadHistory,
} from "@/lib/mentor/mentor-context";

export type MentorGrounding = {
  history: { role: "user" | "assistant"; content: string }[];
  workspaceBlueprint?: string;
  workspaceMemory?: string;
  languageStyleHint: string;
  workspaceName: string;
};

export async function loadMentorGrounding(input: {
  workspaceId?: string;
  workspaceName: string;
  activeChatId?: string;
  clientHistory: { role: "user" | "assistant"; content: string }[];
  latestUserMessage: string;
}): Promise<MentorGrounding> {
  const languageStyleHint = detectLanguageStyleHint(input.latestUserMessage);

  if (!input.workspaceId?.trim()) {
    return {
      history: input.clientHistory.slice(-36),
      languageStyleHint,
      workspaceName: input.workspaceName,
    };
  }

  const [workspace, chatSnapshot] = await Promise.all([
    getWorkspaceById(input.workspaceId.trim()),
    loadWorkspaceChats(input.workspaceId.trim()),
  ]);

  const workspaceName = workspace?.opportunityName?.trim() || input.workspaceName;
  const history = chatSnapshot.ok
    ? mergeActiveThreadHistory({
        chats: chatSnapshot.chats,
        activeChatId: input.activeChatId,
        clientHistory: input.clientHistory,
      })
    : input.clientHistory.slice(-36);

  const workspaceMemory = chatSnapshot.ok
    ? buildWorkspaceChatMemoryDigest(chatSnapshot.chats, input.activeChatId)
    : "";

  return {
    history,
    workspaceBlueprint: workspace ? formatWorkspaceBlueprintContext(workspace) : undefined,
    workspaceMemory,
    languageStyleHint,
    workspaceName,
  };
}
