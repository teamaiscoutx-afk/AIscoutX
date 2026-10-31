import {
  azureChatCompletion,
  fetchLiveMarketContext,
  formatMarketContextBlock,
  isAzureOpenAIConfigured,
} from "@/lib/azure-ai";
import type { OpportunityDeepDive } from "@/lib/dashboard/opportunities";

export function isFounderUiDeepDive(value: unknown): value is OpportunityDeepDive {
  if (!value || typeof value !== "object") return false;
  const d = value as OpportunityDeepDive;
  return (
    typeof d.valueProp === "string" &&
    d.valueProp.length > 0 &&
    Array.isArray(d.painPoints) &&
    d.painPoints.length > 0
  );
}

type BlueprintJson = OpportunityDeepDive & { synthesizedAt?: string };

export async function generateFounderBlueprintDeepDive(input: {
  name: string;
  category: string;
  keywords: string[];
  nicheLabel?: string;
  founderProblem?: string;
  founderSolution?: string;
  founderMvp?: string;
  revenuePotential?: string;
}): Promise<OpportunityDeepDive & { synthesizedAt: string }> {
  if (!isAzureOpenAIConfigured()) {
    throw new Error("Azure OpenAI is not configured.");
  }

  const market = await fetchLiveMarketContext({
    query: `${input.name} ${input.category} ${input.keywords.slice(0, 3).join(" ")}`,
    nicheLabel: input.nicheLabel,
  });

  const raw = await azureChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are AIscoutX Principal Venture Architect. Output ONLY valid JSON tailored to the EXACT startup named by the user — never reuse generic audio/voiceover templates.

Schema:
{
  "valueProp": "co-founder insight in plain language",
  "painPoints": ["3 specific pain points for THIS idea's customers"],
  "solutionFeatures": ["3 workflow steps: how THIS product solves the pains"],
  "targetAudience": ["2-3 paying customer personas with specifics"],
  "riskRadar": {
    "whyFoundersFail": "specific failure mode for THIS niche",
    "scopeFreezeSkip": ["2-3 features to NOT build in V1"],
    "scopeFreezeBuild": "the one narrow V1 scope to ship"
  },
  "playbook": {
    "days1To3": "tactical outreach for THIS idea",
    "days4To7": "trial/validation motion",
    "days8To14": "launch motion"
  },
  "techAndEconomics": {
    "techStack": "production stack specific to THIS product (not generic)",
    "pricingAndMargins": "pricing tiers + margin note for THIS model",
    "breakeven": "concrete breakeven subscriber/revenue math"
  }
}`,
      },
      {
        role: "user",
        content: `${formatMarketContextBlock(market)}

Startup: "${input.name}"
Category: ${input.category}
Keywords: ${input.keywords.join(", ") || "n/a"}
Known problem: ${input.founderProblem ?? "infer from market"}
Known solution angle: ${input.founderSolution ?? "infer from market"}
MVP hint: ${input.founderMvp ?? "infer"}
Revenue band: ${input.revenuePotential ?? "infer realistic SaaS pricing"}`,
      },
    ],
    temperature: 0.45,
    maxTokens: 2800,
    jsonMode: true,
  });

  let parsed: BlueprintJson;
  try {
    parsed = JSON.parse(raw) as BlueprintJson;
  } catch {
    throw new Error("Azure OpenAI returned invalid blueprint JSON.");
  }

  if (!parsed.valueProp || !parsed.painPoints?.length || !parsed.solutionFeatures?.length) {
    throw new Error("Blueprint JSON missing required founder fields.");
  }

  return {
    valueProp: parsed.valueProp,
    painPoints: parsed.painPoints.slice(0, 5),
    solutionFeatures: parsed.solutionFeatures.slice(0, 5),
    targetAudience: (parsed.targetAudience ?? []).slice(0, 4),
    riskRadar: parsed.riskRadar,
    playbook: parsed.playbook,
    techAndEconomics: parsed.techAndEconomics,
    synthesizedAt: new Date().toISOString(),
  };
}
