import type { StartupWorkspace } from "@/lib/founder/types";

export type RadarCategory =
  | "Market Demand"
  | "Competitor Shift"
  | "Regulation"
  | "Buyer Behavior";

export type StartupRadarUpdate = {
  id: string;
  title: string;
  category: RadarCategory;
  score: number;
  explanation: string;
  why: string;
  impact: string;
  source: string;
  sourceLink?: string | null;
};

function clampScore(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(100, Math.round(value)));
}

function firstText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function mapWatchtowerUpdate(input: {
  id: string;
  title: string;
  body: string;
  signalType: string;
  sourceLink?: string | null;
}): StartupRadarUpdate {
  const category: RadarCategory =
    input.signalType === "competition"
      ? "Competitor Shift"
      : input.signalType === "pain_point"
        ? "Market Demand"
        : input.signalType === "momentum"
          ? "Buyer Behavior"
          : "Regulation";

  return {
    id: `live-${input.id}`,
    title: input.title,
    category,
    score: input.signalType === "competition" ? 86 : 82,
    explanation: input.body,
    why: "This item was stored from Founder Watchtower for the active workspace or its niche.",
    impact: "Use it to change this week's positioning, outreach, or scope before the signal goes stale.",
    source: "Founder Watchtower",
    sourceLink: input.sourceLink,
  };
}

export function buildStartupRadar(workspace: StartupWorkspace): StartupRadarUpdate[] {
  const name = workspace.opportunityName?.trim() || "your startup";
  const niche = firstText(workspace.nicheFocus, "your chosen niche");
  const customer = firstText(
    workspace.summary.overview.targetCustomer,
    `buyers already searching for ${niche}`
  );
  const problem = firstText(
    workspace.summary.overview.problem,
    `manual work around ${name} still costs time and money`
  );
  const competitor = firstText(
    workspace.summary.competitors.players[0]?.name,
    "incumbent tools"
  );
  const gap = firstText(
    workspace.summary.competitors.marketGap || workspace.summary.competitors.players[0]?.gap,
    `a simpler workflow for ${customer}`
  );
  const channel = firstText(workspace.summary.launch.channels[0], "direct founder outreach");

  return [
    {
      id: `${workspace.id}-demand`,
      title: `${niche} buyers are paying to remove ${problem.slice(0, 72)}`,
      category: "Market Demand",
      score: clampScore(workspace.validationScore, 78),
      explanation: `${customer} still hit the same friction ${name} is built to remove. Search and community chatter keep circling that job-to-be-done instead of a new category.`,
      why: `The pain is specific: ${problem}. That keeps demand concentrated on a narrow workflow rather than a generic AI tool.`,
      impact: `${name} can lead with the outcome for ${customer} and price against the time they lose today, instead of competing on feature lists.`,
      source: "Startup blueprint",
    },
    {
      id: `${workspace.id}-competitor`,
      title: `${competitor} still leaves ${gap}`,
      category: "Competitor Shift",
      score: clampScore(workspace.mvpScore, 74),
      explanation: `The current alternative, ${competitor}, covers the broad job but does not close ${gap}. Buyers compare tools and then stall on setup, price, or missing workflow.`,
      why: `Switching happens when the gap is operational, not when a new logo appears. ${name} is positioned against that unfinished job.`,
      impact: `Ship the smallest version that makes ${gap} obvious in the first session. Use that contrast in outreach instead of a full platform story.`,
      source: "Startup blueprint",
    },
    {
      id: `${workspace.id}-regulation`,
      title: `Trust and data handling are now part of the ${niche} buying decision`,
      category: "Regulation",
      score: clampScore(workspace.launchScore, 69),
      explanation: `Teams evaluating ${niche} products ask where customer data sits, who can export it, and what happens if they cancel. That question shows up before a paid pilot.`,
      why: `Buyers treat unclear data practices as a reason to delay, even when the product demo works.`,
      impact: `Put a plain-language data note next to the ${name} pricing page and mention it in the first sales conversation so legal review does not stall the deal.`,
      source: "Startup blueprint",
    },
    {
      id: `${workspace.id}-buyer`,
      title: `${channel} is the shortest path to the first paying ${customer}`,
      category: "Buyer Behavior",
      score: clampScore(workspace.salesScore, 81),
      explanation: `Early ${niche} revenue is still coming from conversations, not broad ads. The people who feel ${problem} respond when the message names their week, not the category.`,
      why: `The first buyers want proof on their own workflow before they trust a subscription.`,
      impact: `Use ${channel} this week with one concrete before-and-after for ${name}. Ask for a paid trial instead of a feature wishlist.`,
      source: "Startup blueprint",
    },
  ];
}
