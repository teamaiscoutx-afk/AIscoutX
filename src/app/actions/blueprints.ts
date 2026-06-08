"use server";

import { getWorkspaceById } from "@/app/actions/workspaces";
import {
  generateDeepBlueprint,
  getSummaryContext,
  type BlueprintSectionKey,
  type DeepBlueprint,
} from "@/lib/founder/blueprint-generator";

export async function fetchDeepBlueprint(input: {
  workspaceId: string;
  sectionKey: BlueprintSectionKey;
  sectionTitle: string;
  index?: number;
}): Promise<{ ok: boolean; blueprint?: DeepBlueprint; error?: string }> {
  const workspace = await getWorkspaceById(input.workspaceId);
  if (!workspace) {
    return { ok: false, error: "Workspace not found" };
  }

  const context = getSummaryContext(
    workspace.summary,
    input.sectionKey,
    input.index ?? 0
  );

  const blueprint = generateDeepBlueprint({
    workspace,
    sectionKey: input.sectionKey,
    sectionTitle: input.sectionTitle,
    context,
    index: input.index,
  });

  // Simulate intelligence latency for premium feel
  await new Promise((r) => setTimeout(r, 600));

  return { ok: true, blueprint };
}
