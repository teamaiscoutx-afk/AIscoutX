import type { AnalyzePack, BlueprintPack, LaunchPack } from "@/lib/mvp/types";
import type { LiveOpportunityDraft } from "@/lib/intelligence/types";

export function mapLiveDraftToPacks(draft: LiveOpportunityDraft): {
  analyze: AnalyzePack;
  blueprint: BlueprintPack;
  launch: LaunchPack;
} {
  const { intelligence, deepDive, scores } = draft;

  const analyze: AnalyzePack = {
    problemStatement: intelligence.founder.problem,
    marketSizing: {
      tam: `Demand score ${scores.scores.demand}/100 across live web mentions`,
      sam: `Competition index ${scores.scores.competition}/100 from Product Hunt + GitHub signals`,
      som: `Disruption fit ${scores.scores.disruption}/100 based on automation vs manual task signals`,
      growthRate: scores.growthLabel,
    },
    targetPersonas: [
      {
        name: intelligence.agency.icp.split(" ").slice(0, 4).join(" ") || "Primary ICP",
        pain: intelligence.founder.problem,
        willingnessToPay: draft.revenuePotential,
      },
    ],
    competitors: deepDive.marketGaps.map((gap) => ({
      name: gap.competitor,
      gap: gap.complaint,
      positioning: `Source: ${gap.source}`,
    })),
  };

  const blueprint: BlueprintPack = {
    nameSuggestions: [draft.name, `${draft.name} Pro`, `${draft.name} OS`],
    featureMatrix: {
      mustHave: deepDive.mvpAnatomy.mustHave,
      niceToHave: deepDive.mvpAnatomy.niceToHave,
      future: deepDive.solutionBlueprint.goToMarket.slice(0, 3),
    },
    pricingTiers: [
      {
        name: "Starter",
        price: draft.revenuePotential.split("–")[0]?.trim() ?? "$29/mo",
        features: deepDive.mvpAnatomy.mustHave.slice(0, 3),
      },
      {
        name: "Pro",
        price: draft.revenuePotential.split("–")[1]?.trim() ?? "$99/mo",
        features: [
          ...deepDive.mvpAnatomy.mustHave,
          ...deepDive.mvpAnatomy.niceToHave.slice(0, 2),
        ],
      },
    ],
    techStack: deepDive.mvpAnatomy.techStack.map((row) => ({
      layer: row.layer,
      recommendation: row.tool,
      rationale: row.rationale,
    })),
    roadmap: deepDive.mvpAnatomy.coreFlow.map((step, index) => ({
      week: index + 1,
      milestone: step,
      tasks: deepDive.mvpAnatomy.mustHave.slice(index, index + 2),
    })),
  };

  const launch: LaunchPack = {
    platforms: [
      {
        platform: "Reddit",
        playbook: deepDive.solutionBlueprint.goToMarket.filter((c) =>
          /reddit/i.test(c)
        ),
        samplePost: intelligence.creator.hooks[0] ?? intelligence.founder.solution,
      },
      {
        platform: "X",
        playbook: deepDive.solutionBlueprint.goToMarket.filter((c) =>
          /x|twitter/i.test(c)
        ),
        samplePost: intelligence.creator.videoTitles[0] ?? draft.name,
      },
      {
        platform: "LinkedIn",
        playbook: deepDive.solutionBlueprint.goToMarket,
        samplePost: deepDive.solutionBlueprint.overview,
      },
      {
        platform: "Product Hunt",
        playbook: ["Launch with evidence-backed gap analysis", "Share MVP flow diagram"],
        samplePost: `${draft.name} — ${intelligence.founder.solution}`,
      },
    ],
    outreachScripts: [
      {
        channel: "Cold email",
        subject: `Idea validation: ${draft.name}`,
        body: intelligence.founder.problem,
      },
      {
        channel: "LinkedIn DM",
        subject: "Quick founder question",
        body: intelligence.creator.hooks[1] ?? intelligence.founder.solution,
      },
    ],
  };

  return { analyze, blueprint, launch };
}
