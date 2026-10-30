import { azureChatCompletion, fetchLiveMarketContext, formatMarketContextBlock } from "@/lib/azure-ai";
import { DISCOVERY_IDEA_TARGET } from "@/lib/intelligence/discovery-config";
import { generateStructuredFallbackDrafts } from "@/lib/intelligence/discovery-fallback";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import type { LiveOpportunityDraft } from "@/lib/intelligence/types";

type AzureFeedCard = {
  name: string;
  category: string;
  keywords: string[];
  revenuePotential: string;
  problem: string;
  solution: string;
  mvp: string;
};

/**
 * When Azure AI Search has no index/hits, synthesize a full niche feed via Azure OpenAI only.
 */
export async function generateAzureNicheOpportunityDrafts(input: {
  workspace: WorkspaceIdentity;
  niche: NicheId;
  nicheLabel: string;
  count?: number;
}): Promise<LiveOpportunityDraft[]> {
  const count = input.count ?? DISCOVERY_IDEA_TARGET;
  const market = await fetchLiveMarketContext({
    query: `${input.nicheLabel} startup opportunities demand trends 2026`,
    nicheLabel: input.nicheLabel,
  });

  try {
    const raw = await azureChatCompletion({
      messages: [
        {
          role: "system",
          content: `You are AIscoutX discovery intelligence. Output ONLY valid JSON: { "ideas": [...] }.
Each idea: name, category, keywords (array), revenuePotential, problem, solution, mvp.
Ground ideas in the market context below. Workspace angle: ${input.workspace}.`,
        },
        {
          role: "user",
          content: `${formatMarketContextBlock(market)}

Generate exactly ${count} distinct, high-validation startup concepts for niche "${input.nicheLabel}".`,
        },
      ],
      temperature: 0.45,
      maxTokens: 3200,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw) as { ideas?: AzureFeedCard[] };
    const ideas = (parsed.ideas ?? []).filter((i) => i?.name?.trim()).slice(0, count);
    if (!ideas.length) {
      return generateStructuredFallbackDrafts(input.workspace, input.niche, count);
    }

    const structured = generateStructuredFallbackDrafts(
      input.workspace,
      input.niche,
      count,
      ideas.map((i) => i.name)
    );

    return structured.map((draft, index) => {
      const card = ideas[index];
      if (!card) return draft;
      return {
        ...draft,
        name: card.name,
        category: card.category || draft.category,
        keywords: card.keywords?.length ? card.keywords : draft.keywords,
        revenuePotential: card.revenuePotential || draft.revenuePotential,
        intelligence: {
          ...draft.intelligence,
          founder: {
            problem: card.problem || draft.intelligence.founder.problem,
            solution: card.solution || draft.intelligence.founder.solution,
            mvp: card.mvp || draft.intelligence.founder.mvp,
            launchTime: draft.intelligence.founder.launchTime,
          },
        },
        sources: ["Azure OpenAI", ...(market.provider === "azure_search" ? ["Azure AI Search"] : [])],
        deepDive: {
          ...draft.deepDive,
          synthesizedAt: new Date().toISOString(),
        },
      };
    });
  } catch (err) {
    console.error("[generateAzureNicheOpportunityDrafts]", err);
    return generateStructuredFallbackDrafts(input.workspace, input.niche, count);
  }
}
