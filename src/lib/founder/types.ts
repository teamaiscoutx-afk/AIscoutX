import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { CoreGoal, NicheFocus } from "@/lib/dashboard/onboarding";

export type { CoreGoal, NicheFocus };

export type FounderStage =
  | "discover"
  | "validate"
  | "build"
  | "launch"
  | "grow";

export type GpsVector = "validation" | "mvp" | "launch" | "sales";

export type WorkspaceSummary = {
  overview: {
    tagline: string;
    problem: string;
    solution: string;
    targetCustomer: string;
  };
  validation: {
    hypotheses: string[];
    proofSignals: string[];
    interviewQuestions: string[];
  };
  competitors: {
    players: { name: string; gap: string; positioning: string }[];
    marketGap: string;
  };
  mvp: {
    mustHave: string[];
    mustNot: string[];
    roadmap: { phase: string; features: string[] }[];
  };
  launch: {
    channels: string[];
    first30Days: string[];
    messaging: string;
  };
  revenue: {
    tiers: { name: string; price: string; features: string[] }[];
    pricingModel: string;
  };
};

export type StartupWorkspace = {
  id: string;
  userId: string;
  opportunityId: string | null;
  opportunityName: string;
  summary: WorkspaceSummary;
  currentStage: FounderStage;
  validationScore: number;
  mvpScore: number;
  launchScore: number;
  salesScore: number;
  createdAt: string;
  updatedAt: string;
};

export type DailyTask = {
  id: string;
  workspaceId: string;
  taskText: string;
  isCompleted: boolean;
  stageType: GpsVector;
  createdAt: string;
};

export type NextAction = {
  vector: GpsVector;
  title: string;
  description: string;
  taskText: string;
  templates?: string[];
};

export function buildWorkspaceSummaryFromOpportunity(
  opportunity: Opportunity
): WorkspaceSummary {
  const intel = opportunity.intelligence;

  return {
    overview: {
      tagline: opportunity.name,
      problem:
        intel.founder?.problem ??
        opportunity.drawer.whyThisMatters,
      solution:
        intel.founder?.solution ??
        opportunity.drawer.recommendedAction,
      targetCustomer:
        opportunity.drawer.targetClients ?? "Early adopters in your niche",
    },
    validation: {
      hypotheses: [
        `Customers will pay for ${opportunity.name}`,
        `Demand is rising (${opportunity.growth} growth signal)`,
        `Competition gap exists (${opportunity.competitionLabel})`,
      ],
      proofSignals: opportunity.sources,
      interviewQuestions: [
        "What is your biggest pain with this workflow today?",
        "What have you tried already and why did it fail?",
        "How much would you pay monthly to solve this?",
        "Who else on your team cares about this problem?",
        "What would make you switch from your current tool?",
      ],
    },
    competitors: {
      players: [
        {
          name: "Incumbent tools",
          gap: "Slow, generic, not niche-tailored",
          positioning: "Enterprise-first",
        },
        {
          name: "DIY spreadsheets",
          gap: "No automation or intelligence layer",
          positioning: "Free but manual",
        },
        {
          name: "Emerging startups",
          gap: "Feature bloat, weak onboarding",
          positioning: "Broad horizontal",
        },
      ],
      marketGap: `Underserved segment in ${opportunity.category} with ${opportunity.score}/100 opportunity score`,
    },
    mvp: {
      mustHave: [
        "Core workflow for primary user job-to-be-done",
        "Simple onboarding with instant value",
        "One measurable success metric dashboard",
      ],
      mustNot: [
        "Full automation on day one",
        "Multi-team permissions",
        "Advanced analytics suite",
      ],
      roadmap: [
        {
          phase: "Week 1-2",
          features: ["Landing page", "Waitlist capture", "Manual concierge MVP"],
        },
        {
          phase: "Week 3-4",
          features: ["Core feature v1", "Stripe checkout", "User feedback loop"],
        },
        {
          phase: "Month 2",
          features: ["Retention loops", "Referral hooks", "Usage analytics"],
        },
      ],
    },
    launch: {
      channels: ["LinkedIn", "Reddit communities", "Creator partnerships"],
      first30Days: [
        "Publish problem-solution story on 3 channels",
        "Run 10 founder/customer interviews",
        "Ship concierge MVP to first 5 users",
        "Collect 3 video testimonials",
        "Launch paid pilot offer",
      ],
      messaging: `Help ${opportunity.drawer.targetClients} achieve outcomes faster with ${opportunity.name}`,
    },
    revenue: {
      pricingModel: "Tiered SaaS with annual discount",
      tiers: [
        {
          name: "Starter",
          price: "$29/mo",
          features: ["Core workflow", "Email support", "1 workspace"],
        },
        {
          name: "Pro",
          price: "$79/mo",
          features: ["Advanced automations", "Priority support", "3 workspaces"],
        },
        {
          name: "Enterprise",
          price: "Custom",
          features: ["SSO", "Dedicated onboarding", "Custom integrations"],
        },
      ],
    },
  };
}

export function computeGlobalProgress(workspace: StartupWorkspace): number {
  return Math.round(
    (workspace.validationScore +
      workspace.mvpScore +
      workspace.launchScore +
      workspace.salesScore) /
      4
  );
}

export function deriveNextAction(workspace: StartupWorkspace): NextAction {
  const scores: { vector: GpsVector; score: number }[] = [
    { vector: "validation", score: workspace.validationScore },
    { vector: "mvp", score: workspace.mvpScore },
    { vector: "launch", score: workspace.launchScore },
    { vector: "sales", score: workspace.salesScore },
  ];

  const lowest = scores.reduce((a, b) => (a.score <= b.score ? a : b));

  switch (lowest.vector) {
    case "validation":
      return {
        vector: "validation",
        title: "Validate demand today",
        description:
          "Run customer discovery before building more. Your validation score is the bottleneck.",
        taskText: `Interview 5 potential customers for "${workspace.opportunityName}" using the validation question bank.`,
        templates: workspace.summary.validation.interviewQuestions.slice(0, 3),
      };
    case "mvp":
      return {
        vector: "mvp",
        title: "Ship MVP slice",
        description:
          "Focus only on must-have features. Cut everything in the must-not list.",
        taskText: `Implement the Week 1-2 MVP slice: ${workspace.summary.mvp.roadmap[0]?.features.join(", ") ?? "core workflow"}.`,
        templates: workspace.summary.mvp.mustHave,
      };
    case "launch":
      return {
        vector: "launch",
        title: "Prepare launch motion",
        description:
          "Your product needs distribution. Execute the first 30-day GTM playbook.",
        taskText: `Publish launch narrative on ${workspace.summary.launch.channels[0]} and book 3 demo calls.`,
        templates: workspace.summary.launch.first30Days.slice(0, 3),
      };
    case "sales":
      return {
        vector: "sales",
        title: "Close first revenue",
        description:
          "Turn interest into paid pilots. Sales velocity is your current constraint.",
        taskText: `Send paid pilot offer (${workspace.summary.revenue.tiers[0]?.price}) to 5 warm leads and follow up within 24h.`,
        templates: workspace.summary.revenue.tiers.map(
          (t) => `${t.name}: ${t.price}`
        ),
      };
  }
}

export function scoreIncrement(current: number): number {
  return Math.min(100, current + 10);
}
