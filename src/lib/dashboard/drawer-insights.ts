import type { WorkspaceIdentity } from "@/lib/dashboard/onboarding";
import { identityToWorkspaceMode } from "@/lib/dashboard/onboarding";
import type { Opportunity } from "@/lib/dashboard/opportunities";
import type { WorkspaceMode } from "@/lib/dashboard/workspace";

const FALLBACK = "Insight syncing for this signal…";

export type DrawerInsightSection = {
  label: string;
  value: string;
};

export type DrawerInsightList = {
  label: string;
  items: string[];
};

export type WorkspaceDrawerInsights = {
  workspace: WorkspaceIdentity;
  lens: WorkspaceMode;
  whyItMatters: string;
  bestFor: string;
  recommendedAction: string;
  primaryList?: DrawerInsightList;
  secondaryList?: DrawerInsightList;
  meta?: DrawerInsightSection;
};

function pick(...values: (string | undefined | null)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return FALLBACK;
}

function nonEmpty(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return values.map((v) => String(v).trim()).filter(Boolean);
}

function buildFounderInsights(opportunity: Opportunity): WorkspaceDrawerInsights {
  const { founder } = opportunity.intelligence;

  return {
    workspace: "founder",
    lens: "founder",
    whyItMatters: pick(
      opportunity.drawer.whyThisMatters,
      founder.problem,
      `Demand is accelerating in ${opportunity.category}.`
    ),
    bestFor: pick(founder.mvp, opportunity.category, "Early-stage founders"),
    recommendedAction: pick(
      opportunity.drawer.recommendedAction,
      founder.solution,
      "Ship a focused MVP and validate with 10 design partners."
    ),
    meta: {
      label: "MVP launch window",
      value: pick(founder.launchTime, "14–30 days"),
    },
    primaryList: {
      label: "Problem → solution",
      items: nonEmpty([founder.problem, founder.solution]),
    },
  };
}

function buildCreatorInsights(opportunity: Opportunity): WorkspaceDrawerInsights {
  const { creator, founder } = opportunity.intelligence;
  const videoIdeas = nonEmpty([
    ...nonEmpty(opportunity.drawer.viralVideoIdeas),
    ...nonEmpty(creator.videoTitles),
  ]);
  const hooks = nonEmpty(creator.hooks);

  return {
    workspace: "creator",
    lens: "creator",
    whyItMatters: pick(
      opportunity.drawer.whyThisMatters,
      founder.problem,
      hooks[0],
      `This niche is trending in ${opportunity.category}.`
    ),
    bestFor: pick(creator.platform, "Short-form & long-form creators"),
    recommendedAction: pick(
      opportunity.drawer.recommendedAction,
      founder.solution,
      hooks[0],
      "Publish a validation video using the hooks below."
    ),
    primaryList: {
      label: "Video ideas",
      items: videoIdeas.length > 0 ? videoIdeas : [FALLBACK],
    },
    secondaryList: {
      label: "Script hooks",
      items: hooks.length > 0 ? hooks : [FALLBACK],
    },
    meta: {
      label: "Content angle",
      value: pick(
        opportunity.category,
        opportunity.growth,
        "High-momentum creator opportunity"
      ),
    },
  };
}

function buildAgencyInsights(opportunity: Opportunity): WorkspaceDrawerInsights {
  const { agency, founder } = opportunity.intelligence;

  return {
    workspace: "agency",
    lens: "agency",
    whyItMatters: pick(
      opportunity.drawer.whyThisMatters,
      founder.problem,
      agency.serviceOffer,
      `Clients in ${opportunity.category} need a packaged offer now.`
    ),
    bestFor: pick(
      opportunity.drawer.targetClients,
      agency.icp,
      "Agencies selling high-ticket services"
    ),
    recommendedAction: pick(
      opportunity.drawer.recommendedAction,
      agency.serviceOffer,
      founder.solution,
      "Productize this signal as a retainer-backed sprint."
    ),
    meta: {
      label: "Recommended retainer",
      value: pick(agency.retainer, opportunity.revenuePotential, "$2,500–$8,000/mo"),
    },
    primaryList: {
      label: "Core service offer",
      items: nonEmpty([agency.serviceOffer, founder.solution]),
    },
  };
}

/** Solopreneur uses founder lens for mode panel but agency-flavored summary fields */
function buildSolopreneurInsights(opportunity: Opportunity): WorkspaceDrawerInsights {
  const agency = buildAgencyInsights({
    ...opportunity,
    workspace: "solopreneur",
  });
  const { founder } = opportunity.intelligence;

  return {
    ...agency,
    workspace: "solopreneur",
    lens: identityToWorkspaceMode("solopreneur"),
    whyItMatters: pick(
      opportunity.drawer.whyThisMatters,
      founder.problem,
      agency.whyItMatters
    ),
    bestFor: pick(founder.mvp, agency.bestFor, "Solo operators & indie builders"),
    recommendedAction: pick(
      opportunity.drawer.recommendedAction,
      founder.solution,
      agency.recommendedAction
    ),
  };
}

export function getWorkspaceDrawerInsights(
  opportunity: Opportunity,
  activeWorkspace: WorkspaceIdentity
): WorkspaceDrawerInsights {
  switch (activeWorkspace) {
    case "creator":
      return buildCreatorInsights(opportunity);
    case "agency":
      return buildAgencyInsights(opportunity);
    case "solopreneur":
      return buildSolopreneurInsights(opportunity);
    case "founder":
    default:
      return buildFounderInsights(opportunity);
  }
}
