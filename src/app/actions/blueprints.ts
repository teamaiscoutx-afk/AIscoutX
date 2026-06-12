"use server";

import { getWorkspaceById } from "@/app/actions/workspaces";
import { buildEvidencePromptBlock } from "@/lib/intelligence/copy-engine";
import { isIntelligenceEngineReady } from "@/lib/intelligence/env";
import { synthesizeJson } from "@/lib/intelligence/llm-router";
import { searchAllChannels, flattenSnippets } from "@/lib/intelligence/web-search";
import { computeMetrics, computeScores } from "@/lib/intelligence/score-engine";
import {
  generateDeepBlueprint,
  getSummaryContext,
  type BlueprintSectionKey,
  type DeepBlueprint,
} from "@/lib/founder/blueprint-generator";

type LlmDeepBlueprint = {
  title: string;
  objective: string;
  steps: { order: number; action: string; deliverable: string; timeEstimate: string }[];
  successMetric: string;
  pitfalls: string[];
  proTip: string;
};

const DEEP_BLUEPRINT_TASK = `Produce a section-specific execution blueprint as JSON:
{
  "title": "",
  "objective": "",
  "steps": [{ "order": 1, "action": "", "deliverable": "", "timeEstimate": "" }],
  "successMetric": "",
  "pitfalls": ["", ""],
  "proTip": ""
}
Section focus is provided in the user message. Use evidence only.`;

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

  if (isIntelligenceEngineReady()) {
    try {
      const seed = workspace.opportunityName;
      const channelResults = await searchAllChannels(seed);
      const snippets = flattenSnippets(channelResults);
      const metrics = computeMetrics(channelResults, snippets);
      const scores = computeScores(metrics);

      const evidenceBlock = buildEvidencePromptBlock({
        query: `${input.sectionTitle} for ${seed}`,
        metrics: {
          demand: scores.scores.demand,
          competition: scores.scores.competition,
          section: input.sectionKey,
        },
        snippets,
      });

      const task = `${DEEP_BLUEPRINT_TASK}\nSection: ${input.sectionTitle}\nContext: ${context}`;

      const blueprint = await synthesizeJson<LlmDeepBlueprint>(task, evidenceBlock);
      return { ok: true, blueprint };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Live blueprint failed";
      return { ok: false, error: message };
    }
  }

  const blueprint = generateDeepBlueprint({
    workspace,
    sectionKey: input.sectionKey,
    sectionTitle: input.sectionTitle,
    context,
    index: input.index,
  });

  return { ok: true, blueprint };
}
