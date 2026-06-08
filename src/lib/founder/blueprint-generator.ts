import type { StartupWorkspace, WorkspaceSummary } from "@/lib/founder/types";

export type BlueprintSectionKey =
  | "overview-problem"
  | "overview-solution"
  | "overview-target"
  | "validation-hypothesis"
  | "validation-interview"
  | "validation-signal"
  | "competitor-gap"
  | "competitor-player"
  | "mvp-must-have"
  | "mvp-must-not"
  | "mvp-phase"
  | "launch-messaging"
  | "launch-channel"
  | "launch-day"
  | "revenue-model"
  | "revenue-tier";

export type DeepBlueprint = {
  title: string;
  objective: string;
  steps: { order: number; action: string; deliverable: string; timeEstimate: string }[];
  successMetric: string;
  pitfalls: string[];
  proTip: string;
};

type BlueprintInput = {
  workspace: StartupWorkspace;
  sectionKey: BlueprintSectionKey;
  sectionTitle: string;
  context: string;
  index?: number;
};

function steps(
  items: { action: string; deliverable: string; timeEstimate: string }[]
): DeepBlueprint["steps"] {
  return items.map((item, i) => ({ order: i + 1, ...item }));
}

export function generateDeepBlueprint(input: BlueprintInput): DeepBlueprint {
  const { workspace, sectionKey, sectionTitle, context } = input;
  const name = workspace.opportunityName;
  const stage = workspace.currentStage;

  const base: Omit<DeepBlueprint, "steps"> = {
    title: `${sectionTitle} Blueprint`,
    objective: `Execute a high-leverage plan for "${name}" at the ${stage} stage.`,
    successMetric: "Measurable outcome logged in your workspace within 7 days.",
    pitfalls: [
      "Skipping customer contact and building in isolation",
      "Optimizing polish before proving demand",
      "Adding scope that is not in the must-have list",
    ],
    proTip: "Ship one deliverable today. Momentum beats perfection.",
  };

  switch (sectionKey) {
    case "overview-problem":
      return {
        ...base,
        objective: `Validate and articulate the core problem behind ${name}.`,
        steps: steps([
          { action: "Interview 3 ICP users about their top workflow pain", deliverable: "Pain log with quotes", timeEstimate: "45 min" },
          { action: "Rank pains by frequency × willingness-to-pay", deliverable: "Prioritized problem stack", timeEstimate: "20 min" },
          { action: "Rewrite problem statement in one sentence", deliverable: "Problem headline", timeEstimate: "15 min" },
          { action: "Post problem statement in 2 communities for reactions", deliverable: "10+ reactions or comments", timeEstimate: "30 min" },
        ]),
        successMetric: "Problem statement gets 3+ \"I feel this\" responses.",
        proTip: `Anchor on: ${context}`,
      };

    case "overview-solution":
      return {
        ...base,
        steps: steps([
          { action: "Map problem → outcome → mechanism in 3 bullets", deliverable: "Solution map", timeEstimate: "25 min" },
          { action: "Define the 10-minute wow moment for new users", deliverable: "Activation moment spec", timeEstimate: "20 min" },
          { action: "Record a 60s Loom demo of manual concierge version", deliverable: "Demo link", timeEstimate: "40 min" },
          { action: "Send demo to 5 prospects and capture objections", deliverable: "Objection matrix", timeEstimate: "1 hr" },
        ]),
        successMetric: "2 prospects ask for next step after seeing solution.",
      };

    case "overview-target":
      return {
        ...base,
        steps: steps([
          { action: "Define ICP firmographics + psychographics", deliverable: "ICP one-pager", timeEstimate: "30 min" },
          { action: "List 20 accounts matching ICP on LinkedIn", deliverable: "Target account list", timeEstimate: "35 min" },
          { action: "Draft outreach opener tailored to ICP pain", deliverable: "3 message variants", timeEstimate: "25 min" },
          { action: "Send 10 personalized outreaches", deliverable: "Outreach tracker", timeEstimate: "45 min" },
        ]),
        successMetric: "Book 2 discovery calls from target list.",
      };

    case "validation-hypothesis":
      return {
        ...base,
        objective: `Pressure-test hypothesis: ${context}`,
        steps: steps([
          { action: "Write falsifiable hypothesis with metric threshold", deliverable: "Hypothesis card", timeEstimate: "15 min" },
          { action: "Design smallest experiment (no code if possible)", deliverable: "Experiment brief", timeEstimate: "20 min" },
          { action: "Run experiment with 10 participants", deliverable: "Raw response sheet", timeEstimate: "2 hr" },
          { action: "Score pass/fail and decide pivot or proceed", deliverable: "Decision note", timeEstimate: "20 min" },
        ]),
        successMetric: "Clear go/no-go recorded with evidence.",
      };

    case "validation-interview":
      return {
        ...base,
        steps: steps([
          { action: "Prepare 5 open-ended questions from script", deliverable: "Interview guide", timeEstimate: "15 min" },
          { action: "Book 5 calls with ICP this week", deliverable: "Calendar slots", timeEstimate: "30 min" },
          { action: "Run interviews; capture exact phrases used", deliverable: "Verbatim notes", timeEstimate: "2.5 hr" },
          { action: "Cluster insights into themes", deliverable: "Insight themes doc", timeEstimate: "30 min" },
        ]),
        successMetric: "3 recurring pain themes across interviews.",
        proTip: `Lead with: "${context}"`,
      };

    case "validation-signal":
      return {
        ...base,
        steps: steps([
          { action: "Collect 3 proof signals from market data", deliverable: "Signal evidence pack", timeEstimate: "40 min" },
          { action: "Cross-reference with your interview findings", deliverable: "Signal × interview matrix", timeEstimate: "25 min" },
          { action: "Publish a mini insight post using one signal", deliverable: "Published post URL", timeEstimate: "35 min" },
          { action: "Track inbound interest for 48 hours", deliverable: "Engagement log", timeEstimate: "15 min" },
        ]),
        successMetric: "At least 1 inbound DM or reply from target ICP.",
      };

    case "competitor-gap":
      return {
        ...base,
        steps: steps([
          { action: "Map top 5 alternatives users compare against", deliverable: "Competitive set", timeEstimate: "30 min" },
          { action: "Score each on speed, price, niche-fit, UX", deliverable: "Comparison grid", timeEstimate: "35 min" },
          { action: "Identify one wedge only you can own", deliverable: "Wedge statement", timeEstimate: "20 min" },
          { action: "Test wedge in landing page headline A/B", deliverable: "2 headline variants", timeEstimate: "25 min" },
        ]),
        successMetric: "Wedge produces higher click-through on landing test.",
        proTip: context,
      };

    case "competitor-player":
      return {
        ...base,
        steps: steps([
          { action: "Document competitor's core promise and pricing", deliverable: "Competitor snapshot", timeEstimate: "25 min" },
          { action: "Mine 10 negative reviews for unmet needs", deliverable: "Gap opportunities list", timeEstimate: "30 min" },
          { action: "Draft counter-positioning for your offer", deliverable: "Positioning paragraph", timeEstimate: "20 min" },
          { action: "Add counter-positioning to sales script", deliverable: "Updated script", timeEstimate: "15 min" },
        ]),
        successMetric: "Sales script handles top 3 objections confidently.",
      };

    case "mvp-must-have":
      return {
        ...base,
        steps: steps([
          { action: "Break feature into 3 user stories with acceptance criteria", deliverable: "Story cards", timeEstimate: "30 min" },
          { action: "Build thinnest slice that delivers core outcome", deliverable: "Working prototype", timeEstimate: "4 hr" },
          { action: "Run 3 user tests; note friction points", deliverable: "UX friction log", timeEstimate: "1 hr" },
          { action: "Fix top friction only; defer the rest", deliverable: "Ship note", timeEstimate: "2 hr" },
        ]),
        successMetric: "3 users complete core job without assistance.",
      };

    case "mvp-must-not":
      return {
        ...base,
        steps: steps([
          { action: "List requested features outside MVP scope", deliverable: "Scope parking lot", timeEstimate: "15 min" },
          { action: "Tag each as now / later / never with rationale", deliverable: "Scope decision log", timeEstimate: "20 min" },
          { action: "Communicate scope boundaries to stakeholders", deliverable: "Scope announcement", timeEstimate: "15 min" },
          { action: "Set review date to revisit deferred items", deliverable: "Calendar reminder", timeEstimate: "5 min" },
        ]),
        successMetric: "Zero scope creep added this sprint.",
        proTip: `Defer: ${context}`,
      };

    case "mvp-phase":
      return {
        ...base,
        steps: steps([
          { action: "Break phase into weekly milestones", deliverable: "Milestone board", timeEstimate: "25 min" },
          { action: "Assign owner + deadline per milestone", deliverable: "Accountability sheet", timeEstimate: "15 min" },
          { action: "Ship milestone 1 demo internally", deliverable: "Internal demo recording", timeEstimate: "3 hr" },
          { action: "Collect feedback and adjust milestone 2", deliverable: "Updated plan", timeEstimate: "30 min" },
        ]),
        successMetric: "Milestone 1 shipped on schedule.",
      };

    case "launch-messaging":
      return {
        ...base,
        steps: steps([
          { action: "Write problem-agitate-solve hook in 2 lines", deliverable: "Hook copy", timeEstimate: "20 min" },
          { action: "Draft launch narrative email + social thread", deliverable: "Launch copy pack", timeEstimate: "45 min" },
          { action: "Get 2 peer reviews on clarity", deliverable: "Edited final copy", timeEstimate: "20 min" },
          { action: "Schedule launch posts across channels", deliverable: "Scheduled posts", timeEstimate: "25 min" },
        ]),
        successMetric: "Launch copy published to 3 channels.",
      };

    case "launch-channel":
      return {
        ...base,
        steps: steps([
          { action: "Define channel-specific CTA and format", deliverable: "Channel playbook", timeEstimate: "20 min" },
          { action: "Prepare 3 assets tailored to channel norms", deliverable: "Asset kit", timeEstimate: "1 hr" },
          { action: "Publish and engage in first-hour replies", deliverable: "Engagement log", timeEstimate: "45 min" },
          { action: "Track clicks/signups for 72 hours", deliverable: "Channel metrics", timeEstimate: "20 min" },
        ]),
        successMetric: "Channel drives 10+ qualified visits.",
      };

    case "launch-day":
      return {
        ...base,
        steps: steps([
          { action: "Break day into morning outreach + afternoon follow-ups", deliverable: "Day plan", timeEstimate: "15 min" },
          { action: "Execute outreach block with templates", deliverable: "20 outreaches sent", timeEstimate: "2 hr" },
          { action: "Log responses and book calls same-day", deliverable: "Pipeline update", timeEstimate: "45 min" },
          { action: "End-of-day retro: what worked / what didn't", deliverable: "Retro notes", timeEstimate: "15 min" },
        ]),
        successMetric: "At least 2 meaningful conversations started today.",
        proTip: context,
      };

    case "revenue-model":
      return {
        ...base,
        steps: steps([
          { action: "Model 3 pricing scenarios with unit economics", deliverable: "Pricing spreadsheet", timeEstimate: "40 min" },
          { action: "Validate willingness-to-pay in 5 calls", deliverable: "Price sensitivity notes", timeEstimate: "1 hr" },
          { action: "Pick starter price with clear upgrade path", deliverable: "Pricing decision", timeEstimate: "20 min" },
          { action: "Publish pricing page with FAQ objections", deliverable: "Live pricing page", timeEstimate: "45 min" },
        ]),
        successMetric: "First paid pilot closed at chosen price.",
      };

    case "revenue-tier":
      return {
        ...base,
        steps: steps([
          { action: "Define tier promise in one outcome sentence", deliverable: "Tier value prop", timeEstimate: "15 min" },
          { action: "Map features to tier with upgrade triggers", deliverable: "Tier feature matrix", timeEstimate: "25 min" },
          { action: "Create Stripe/product checkout for tier", deliverable: "Checkout link", timeEstimate: "35 min" },
          { action: "Offer tier to 5 warm leads", deliverable: "Offer tracker", timeEstimate: "45 min" },
        ]),
        successMetric: "1 conversion or strong purchase intent signal.",
        proTip: `${context} — anchor value before revealing price.`,
      };

    default:
      return {
        ...base,
        steps: steps([
          { action: "Define success criteria for this section", deliverable: "Success brief", timeEstimate: "15 min" },
          { action: "Execute highest-leverage task today", deliverable: "Completed action", timeEstimate: "1 hr" },
          { action: "Log result in workspace notes", deliverable: "Progress entry", timeEstimate: "10 min" },
        ]),
      };
  }
}

export function getSummaryContext(
  summary: WorkspaceSummary,
  sectionKey: BlueprintSectionKey,
  index = 0
): string {
  switch (sectionKey) {
    case "overview-problem":
      return summary.overview.problem;
    case "overview-solution":
      return summary.overview.solution;
    case "overview-target":
      return summary.overview.targetCustomer;
    case "validation-hypothesis":
      return summary.validation.hypotheses[index] ?? "";
    case "validation-interview":
      return summary.validation.interviewQuestions[index] ?? "";
    case "validation-signal":
      return summary.validation.proofSignals[index] ?? "";
    case "competitor-gap":
      return summary.competitors.marketGap;
    case "competitor-player":
      return summary.competitors.players[index]?.name ?? "";
    case "mvp-must-have":
      return summary.mvp.mustHave[index] ?? "";
    case "mvp-must-not":
      return summary.mvp.mustNot[index] ?? "";
    case "mvp-phase":
      return summary.mvp.roadmap[index]?.phase ?? "";
    case "launch-messaging":
      return summary.launch.messaging;
    case "launch-channel":
      return summary.launch.channels[index] ?? "";
    case "launch-day":
      return summary.launch.first30Days[index] ?? "";
    case "revenue-model":
      return summary.revenue.pricingModel;
    case "revenue-tier":
      return summary.revenue.tiers[index]?.name ?? "";
    default:
      return "";
  }
}
