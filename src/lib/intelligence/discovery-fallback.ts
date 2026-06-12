import type { TrendStage } from "@/lib/dashboard/opportunities";
import type { NicheId, WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { getNicheLabel } from "@/lib/dashboard/onboarding";
import { DISCOVERY_IDEA_TARGET } from "@/lib/intelligence/discovery-config";
import type {
  LiveOpportunityDraft,
  OpportunityDeepDive,
  ScoreEngineOutput,
} from "@/lib/intelligence/types";

const IDEA_SHAPES = [
  "{niche} Workflow Copilot",
  "{niche} Client Intake Automation",
  "{niche} Reporting Dashboard",
  "AI {niche} Concierge",
  "{niche} Subscription Portal",
  "{niche} Lead Qualification Engine",
  "{niche} Ops Command Center",
  "Vertical {niche} Agent",
  "{niche} Retention Automation",
  "{niche} Revenue Intelligence Hub",
] as const;

const WORKSPACE_ANGLE: Record<WorkspaceIdentity, string> = {
  founder: "venture-scale",
  creator: "audience-first",
  agency: "client-service",
  solopreneur: "solo-founder",
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function buildScores(index: number, niche: NicheId, workspace: WorkspaceIdentity): ScoreEngineOutput {
  const base = hashSeed(`${niche}:${workspace}:${index}`);
  const demand = clamp(62 + (base % 28));
  const competition = clamp(35 + ((base >> 3) % 40));
  const virality = clamp(55 + ((base >> 5) % 30));
  const monetization = clamp(58 + ((base >> 7) % 28));
  const disruption = clamp(50 + ((base >> 9) % 35));
  const overallScore = clamp(
    demand * 0.35 +
      (100 - competition) * 0.25 +
      virality * 0.2 +
      monetization * 0.1 +
      disruption * 0.1
  );
  const velocity = clamp(40 + (base % 55));
  let trendStage: TrendStage = "Emerging";
  if (velocity >= 80 && demand >= 75) trendStage = "Breakout";
  else if (velocity >= 50 || demand >= 65) trendStage = "Accelerating";
  else if (competition >= 75 && demand < 60) trendStage = "Peaking";

  let competitionLabel: "Low" | "Medium" | "High" = "Medium";
  if (competition < 40) competitionLabel = "Low";
  else if (competition >= 70) competitionLabel = "High";

  return {
    scores: { demand, competition, virality, monetization, disruption },
    overallScore,
    growthLabel: `+${velocity}%`,
    trendStage,
    competitionLabel,
    aiConfidence: clamp(overallScore * 0.65 + 18),
    metrics: {
      mentionVolume: clamp(8 + (base % 20)),
      redditMentions: clamp(2 + (base % 8)),
      xMentions: clamp(2 + (base % 6)),
      youtubeMentions: clamp(1 + (base % 5)),
      productHuntMentions: clamp(1 + (base % 4)),
      githubMentions: clamp(1 + (base % 4)),
      complaintSignals: clamp(3 + (base % 7)),
      competitorAlternatives: clamp(2 + (base % 5)),
      recentVelocity: clamp(3 + (base % 10)),
      aiAutomationFit: disruption,
    },
  };
}

function buildDeepDive(name: string, nicheLabel: string): OpportunityDeepDive {
  const now = new Date().toISOString();
  return {
    marketGaps: [
      {
        competitor: "Manual spreadsheet workflows",
        complaint: `Teams still stitch together ${nicheLabel.toLowerCase()} ops by hand.`,
        source: "Structured intelligence model",
        url: "https://aiscoutx.com",
      },
    ],
    solutionBlueprint: {
      overview: `${name} packages a focused ${nicheLabel.toLowerCase()} workflow with automation-first UX.`,
      businessModel: "Self-serve SaaS with tiered monthly plans",
      goToMarket: ["Niche communities", "Product Hunt launch", "Founder-led outbound"],
      technicalArchitecture: ["Next.js frontend", "Supabase backend", "OpenAI automations"],
      risks: ["Incumbent bundling", "Long sales cycles in enterprise"],
    },
    mvpAnatomy: {
      coreFlow: [
        "Capture user niche + goal",
        "Generate scoped workflow",
        "Automate first repetitive task",
        "Export client-ready report",
      ],
      techStack: [
        { layer: "Frontend", tool: "Next.js", rationale: "Fast shipping + SEO" },
        { layer: "Database", tool: "Supabase", rationale: "Auth + realtime" },
      ],
      mustHave: ["Guided onboarding", "Core automation loop", "Export/share"],
      niceToHave: ["Team seats", "White-label PDF"],
    },
    evidenceUrls: ["https://aiscoutx.com"],
    synthesizedAt: now,
  };
}

/**
 * Premium structured fallback — niche/workspace-aware cards when live APIs fail or time out.
 */
export function generateStructuredFallbackDrafts(
  workspace: WorkspaceIdentity,
  niche: NicheId,
  count = DISCOVERY_IDEA_TARGET,
  excludeNames: string[] = []
): LiveOpportunityDraft[] {
  const nicheLabel = getNicheLabel(workspace, niche);
  const angle = WORKSPACE_ANGLE[workspace];
  const excluded = new Set(excludeNames.map((n) => n.trim().toLowerCase()));
  const drafts: LiveOpportunityDraft[] = [];

  for (let i = 0; i < IDEA_SHAPES.length && drafts.length < count; i += 1) {
    const template = IDEA_SHAPES[i];
    const name = template.replace("{niche}", nicheLabel);
    if (excluded.has(name.toLowerCase())) continue;

    const scores = buildScores(i, niche, workspace);
    const category = `${nicheLabel} · ${angle}`;

    drafts.push({
      name,
      category,
      keywords: [
        nicheLabel.toLowerCase(),
        workspace,
        "saas",
        "automation",
        template.split(" ")[0]?.toLowerCase() ?? "workflow",
      ],
      sources: ["Structured Feed", "Niche Model"],
      revenuePotential: scores.overallScore >= 80 ? "$3k–$12k/mo" : "$1k–$6k/mo",
      intelligence: {
        founder: {
          problem: `${nicheLabel} operators lose hours on repetitive ${angle} workflows every week.`,
          solution: `${name} automates the highest-friction step with a focused, shippable MVP.`,
          mvp: `Landing page + automated ${nicheLabel.toLowerCase()} workflow for 10 pilot users.`,
          launchTime: `${14 + (i % 3) * 7} days`,
        },
        creator: {
          videoTitles: [
            `The ${nicheLabel} SaaS angle nobody is packaging yet`,
            `I mapped demand for ${name} — here's the gap`,
            `Build in public: ${nicheLabel} automation MVP`,
          ],
          hooks: [
            `${nicheLabel} demand is rising — this workflow is still wide open.`,
            `Ship a ${angle} offer before incumbents notice the gap.`,
          ],
          platform: "YouTube + LinkedIn",
        },
        agency: {
          serviceOffer: `Done-for-you ${nicheLabel.toLowerCase()} automation setup`,
          icp: `${nicheLabel} buyers with recurring workflow pain`,
          retainer: "$2,000–$6,500/mo",
        },
      },
      deepDive: buildDeepDive(name, nicheLabel),
      scores,
    });
  }

  return drafts.slice(0, count);
}
