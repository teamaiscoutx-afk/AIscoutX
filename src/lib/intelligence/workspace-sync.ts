import { discoverLiveOpportunity } from "@/lib/intelligence/opportunity-engine";
import type {
  PlatformNotificationPayload,
  WorkspaceSignalDelta,
} from "@/lib/intelligence/types";
import { isIntelligenceEngineReady } from "@/lib/intelligence/env";

export type WorkspaceWatchTarget = {
  id: string;
  opportunityName: string;
  nicheFocus: string;
  validationScore: number;
  mvpScore: number;
  previousDemand?: number;
  previousCompetition?: number;
  previousDisruption?: number;
};

export async function scanWorkspaceForSignals(
  workspace: WorkspaceWatchTarget
): Promise<{
  delta: WorkspaceSignalDelta | null;
  notification: PlatformNotificationPayload | null;
  validationScore: number;
  mvpScore: number;
}> {
  if (!isIntelligenceEngineReady()) {
    return {
      delta: null,
      notification: null,
      validationScore: workspace.validationScore,
      mvpScore: workspace.mvpScore,
    };
  }

  const seed = workspace.nicheFocus || workspace.opportunityName;
  const live = await discoverLiveOpportunity(seed);

  const demand = live.scores.scores.demand;
  const competition = live.scores.scores.competition;
  const disruption = live.scores.scores.disruption;

  const prevDemand = workspace.previousDemand ?? demand;
  const prevCompetition = workspace.previousCompetition ?? competition;
  const prevDisruption = workspace.previousDisruption ?? disruption;

  const demandDelta = demand - prevDemand;
  const competitionDelta = competition - prevCompetition;
  const disruptionDelta = disruption - prevDisruption;

  const momentumShift = demandDelta + disruptionDelta - competitionDelta * 0.5;
  const validationBump = Math.max(0, Math.min(8, Math.round(momentumShift / 3)));
  const mvpBump = Math.max(0, Math.min(6, Math.round(disruptionDelta / 4)));

  const validationScore = Math.min(100, workspace.validationScore + validationBump);
  const mvpScore = Math.min(100, workspace.mvpScore + mvpBump);

  const topGap = live.deepDive.marketGaps[0];
  if (!topGap || Math.abs(momentumShift) < 5) {
    return { delta: null, notification: null, validationScore, mvpScore };
  }

  const painPoint = topGap.complaint;
  const solutionHint = live.deepDive.solutionBlueprint.overview;

  const delta: WorkspaceSignalDelta = {
    workspaceId: workspace.id,
    nicheFocus: workspace.nicheFocus,
    demandDelta,
    competitionDelta,
    disruptionDelta,
    painPoint,
    solutionHint,
  };

  const notification: PlatformNotificationPayload = {
    title: "New pain point in your active niche",
    body: `${painPoint} Solution provided: ${solutionHint.slice(0, 140)}…`,
    emoji: "🔔",
    signalType: "pain_point",
    workspaceId: workspace.id,
    sourceLink: topGap.url,
    nicheFocus: workspace.nicheFocus,
    metadata: {
      demand,
      competition,
      disruption,
      evidenceUrl: topGap.url,
      source: topGap.source,
    },
  };

  return { delta, notification, validationScore, mvpScore };
}
