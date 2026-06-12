"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

import { BuildInput } from "@/components/mvp/build-input";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { IntelligenceScanner } from "@/components/dashboard/intelligence-scanner";
import { NicheSwitcher } from "@/components/dashboard/niche-switcher";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { OpportunitiesFeed } from "@/components/dashboard/opportunities-feed";
import { OpportunityDrawer } from "@/components/dashboard/opportunity-drawer";
import { OpportunityOfDay } from "@/components/dashboard/opportunity-of-day";
import { TrendingSection } from "@/components/dashboard/trending-section";
import type { OpportunitiesDataSource } from "@/app/actions/opportunities";
import type { PlatformNotification } from "@/app/actions/notifications";
import { refreshLiveOpportunityFeed, getIntelligenceStatus } from "@/app/actions/intelligence";
import { gateOpportunityExpansion } from "@/app/actions/usage";
import { PlanSelectorModal } from "@/components/billing/plan-selector-modal";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { completeOnboardingProfile, updateProfileWorkspace } from "@/app/actions/profile";
import { buildFeedViewModel } from "@/lib/dashboard/feed-utils";
import {
  filterOpportunitiesByKeyword,
  filterOpportunitiesBySearch,
  type Opportunity,
} from "@/lib/dashboard/opportunities";
import { extractSearchTokens } from "@/lib/dashboard/search";
import {
  getDefaultNicheForIdentity,
  getNicheLabel,
  getNichesForIdentity,
  loadNicheByWorkspace,
  loadOnboardingProfile,
  saveNicheByWorkspace,
  saveOnboardingProfile,
  type CoreGoal,
  type NicheByWorkspace,
  type NicheFocus,
  type NicheId,
  type UserOnboardingProfile,
  type WorkspaceIdentity,
} from "@/lib/dashboard/onboarding";
import { Badge } from "@/components/ui/badge";

type ExperiencePhase =
  | "hydrating"
  | "onboarding"
  | "scanning"
  | "plan-select"
  | "ready";

type CommandCenterProps = {
  initialOpportunities: Opportunity[];
  dataSource: OpportunitiesDataSource;
  statusMessage?: string;
  intelligenceReady: boolean;
  initialNotifications?: PlatformNotification[];
  initialWorkspace: WorkspaceIdentity;
  initialNiche: NicheId;
};

function resolveActiveNiche(
  workspace: WorkspaceIdentity,
  prefs: NicheByWorkspace
): { id: NicheId; label: string } {
  const validIds = new Set(
    getNichesForIdentity(workspace).map((n) => n.id)
  );
  const saved = prefs[workspace];
  if (saved?.id && validIds.has(saved.id)) {
    return {
      id: saved.id,
      label: saved.label ?? getNicheLabel(workspace, saved.id),
    };
  }
  return getDefaultNicheForIdentity(workspace);
}

const SOURCE_LABEL: Record<OpportunitiesDataSource, string> = {
  live: "Live Web",
  cache: "Cached Signals",
  unconfigured: "API Keys Needed",
};

function resolveFeedSourceLabel(
  source: OpportunitiesDataSource,
  engineReady: boolean
): string {
  if (!engineReady) return "API Keys Needed";
  return SOURCE_LABEL[source === "unconfigured" ? "live" : source];
}

export function CommandCenter({
  initialOpportunities,
  dataSource,
  statusMessage,
  intelligenceReady,
  initialNotifications,
  initialWorkspace,
  initialNiche,
}: CommandCenterProps) {
  const { openUpgradeModal } = useUpgradeModal();
  const [phase, setPhase] = useState<ExperiencePhase>("hydrating");
  const [, setProfile] = useState<UserOnboardingProfile | null>(null);
  const [allOpportunities, setAllOpportunities] =
    useState<Opportunity[]>(initialOpportunities);
  const [feedSource, setFeedSource] =
    useState<OpportunitiesDataSource>(dataSource);
  const [feedStatus, setFeedStatus] = useState<string | undefined>(
    statusMessage
  );
  const [engineReady, setEngineReady] = useState(intelligenceReady);
  const [feedLoading, setFeedLoading] = useState(false);

  const [draftIdentity, setDraftIdentity] = useState<WorkspaceIdentity | null>(
    null
  );
  const [draftGoal, setDraftGoal] = useState<CoreGoal | null>(null);
  const [draftNicheFocus, setDraftNicheFocus] = useState<NicheFocus | null>(
    null
  );
  const [draftNiche, setDraftNiche] = useState<NicheId | null>(null);
  const [draftNicheLabel, setDraftNicheLabel] = useState("");

  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceIdentity>(initialWorkspace);
  const [nicheByWorkspace, setNicheByWorkspace] = useState<NicheByWorkspace>({
    [initialWorkspace]: {
      id: initialNiche,
      label: getNicheLabel(initialWorkspace, initialNiche),
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchTokens(extractSearchTokens(query));
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchTokens(extractSearchTokens(query));
    requestAnimationFrame(() => {
      document
        .getElementById("opportunities")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [keywordFilter, setKeywordFilter] = useState<string | null>(null);

  const activeNicheEntry = useMemo(
    () => resolveActiveNiche(activeWorkspace, nicheByWorkspace),
    [activeWorkspace, nicheByWorkspace]
  );

  const activeNiche = activeNicheEntry.id;
  const activeNicheLabel = activeNicheEntry.label;

  const contextFeed = useMemo(
    () => buildFeedViewModel(allOpportunities, activeWorkspace, activeNiche),
    [allOpportunities, activeWorkspace, activeNiche]
  );

  const opportunityOfDay = useMemo(() => {
    const match = contextFeed.opportunities.find(
      (o) => o.id === contextFeed.opportunityOfTheDayId
    );
    return match ?? contextFeed.opportunities[0] ?? null;
  }, [contextFeed]);

  const filteredOpportunities = useMemo(() => {
    const byKeyword = filterOpportunitiesByKeyword(
      contextFeed.opportunities,
      keywordFilter
    );
    if (!searchQuery.trim() && searchTokens.length === 0) {
      return byKeyword;
    }
    return filterOpportunitiesBySearch(byKeyword, searchQuery);
  }, [contextFeed.opportunities, keywordFilter, searchQuery, searchTokens]);

  const stats = useMemo(() => {
    const list = contextFeed.opportunities;
    const count = list.length;
    const avgScore =
      count > 0
        ? Math.round(list.reduce((sum, o) => sum + o.score, 0) / count)
        : 0;
    const hotCount = list.filter((o) => o.hot).length;

    return [
      { value: String(count), label: "Ideas to evaluate" },
      { value: String(avgScore), label: "Validation potential" },
      { value: String(hotCount), label: "Ready to build" },
    ];
  }, [contextFeed.opportunities]);

  const persistNichePref = useCallback(
    (workspace: WorkspaceIdentity, nicheId: NicheId, label: string) => {
      setNicheByWorkspace((prev) => {
        const next: NicheByWorkspace = {
          ...prev,
          [workspace]: { id: nicheId, label },
        };
        saveNicheByWorkspace(next);
        return next;
      });
    },
    []
  );

  const syncProfileNiche = useCallback(
    (workspace: WorkspaceIdentity, nicheId: NicheId, label: string) => {
      setProfile((prev) => {
        if (!prev || prev.identity !== workspace) return prev;
        const updated: UserOnboardingProfile = {
          ...prev,
          niche: nicheId,
          nicheLabel: label,
        };
        saveOnboardingProfile(updated);
        return updated;
      });
    },
    []
  );

  const syncWorkspaceToProfile = useCallback(
    (workspace: WorkspaceIdentity, nicheId: NicheId) => {
      void updateProfileWorkspace(workspace, nicheId);
    },
    []
  );

  useEffect(() => {
    const saved = loadOnboardingProfile();
    const nichePrefs = loadNicheByWorkspace();

    if (saved) {
      const normalized: UserOnboardingProfile = {
        ...saved,
        goal: saved.goal ?? "build-startup",
        nicheFocus: saved.nicheFocus ?? "ai",
      };
      const workspace = normalized.identity;
      const nicheId = normalized.niche;
      const label = normalized.nicheLabel || getNicheLabel(workspace, nicheId);
      const mergedPrefs: NicheByWorkspace = {
        ...nichePrefs,
        [workspace]: { id: nicheId, label },
      };
      setNicheByWorkspace(mergedPrefs);
      setActiveWorkspace(workspace);
      setProfile(normalized);
      setPhase("ready");
    } else {
      setPhase("onboarding");
    }
  }, []);

  const openOpportunity = useCallback(
    (opportunity: Opportunity) => {
      void (async () => {
        const gate = await gateOpportunityExpansion();
        if (!gate.allowed) {
          openUpgradeModal(gate.reason);
          return;
        }
        setSelectedOpportunity(opportunity);
      })();
    },
    [openUpgradeModal]
  );

  const closeDrawer = useCallback(() => {
    setSelectedOpportunity(null);
  }, []);

  const handleIdentityChange = useCallback((identity: WorkspaceIdentity) => {
    setDraftIdentity(identity);
    setDraftGoal(null);
    setDraftNicheFocus(null);
    setDraftNiche(null);
    setDraftNicheLabel("");
  }, []);

  const handleGoalChange = useCallback((goal: CoreGoal) => {
    setDraftGoal(goal);
  }, []);

  const handleNicheFocusChange = useCallback((focus: NicheFocus) => {
    setDraftNicheFocus(focus);
    setDraftNiche(null);
    setDraftNicheLabel("");
  }, []);

  const handleNicheChange = useCallback((niche: NicheId, label: string) => {
    setDraftNiche(niche);
    setDraftNicheLabel(label);
  }, []);

  const handleInitialize = useCallback(() => {
    if (!draftIdentity || !draftGoal || !draftNicheFocus || !draftNiche || !draftNicheLabel) {
      return;
    }
    setPhase("scanning");
  }, [draftIdentity, draftGoal, draftNicheFocus, draftNiche, draftNicheLabel]);

  const handleScanComplete = useCallback(() => {
    if (
      !draftIdentity ||
      !draftGoal ||
      !draftNicheFocus ||
      !draftNiche ||
      !draftNicheLabel
    ) {
      return;
    }

    const newProfile: UserOnboardingProfile = {
      identity: draftIdentity,
      goal: draftGoal,
      nicheFocus: draftNicheFocus,
      niche: draftNiche,
      nicheLabel: draftNicheLabel,
      completedAt: new Date().toISOString(),
    };

    const nextPrefs: NicheByWorkspace = {
      ...nicheByWorkspace,
      [draftIdentity]: { id: draftNiche, label: draftNicheLabel },
    };

    saveOnboardingProfile(newProfile);
    saveNicheByWorkspace(nextPrefs);
    setProfile(newProfile);
    setNicheByWorkspace(nextPrefs);
    setActiveWorkspace(draftIdentity);
    syncWorkspaceToProfile(draftIdentity, draftNiche);
    void completeOnboardingProfile({
      persona: draftIdentity,
      goal: draftGoal,
      nicheFocus: draftNicheFocus,
      currentNiche: draftNiche,
    });
    setPhase("plan-select");
  }, [
    draftIdentity,
    draftGoal,
    draftNicheFocus,
    draftNiche,
    draftNicheLabel,
    nicheByWorkspace,
    syncWorkspaceToProfile,
  ]);

  const handleActiveWorkspaceChange = useCallback(
    (workspace: WorkspaceIdentity) => {
      setActiveWorkspace(workspace);
      setKeywordFilter(null);
      setSearchQuery("");
      setSearchTokens([]);
      setSelectedOpportunity(null);
      const niche = resolveActiveNiche(workspace, nicheByWorkspace);
      syncWorkspaceToProfile(workspace, niche.id);
    },
    [nicheByWorkspace, syncWorkspaceToProfile]
  );

  const handleNicheSwap = useCallback(
    (nicheId: NicheId, label: string) => {
      persistNichePref(activeWorkspace, nicheId, label);
      syncProfileNiche(activeWorkspace, nicheId, label);
      syncWorkspaceToProfile(activeWorkspace, nicheId);
      setKeywordFilter(null);
      setSelectedOpportunity(null);
    },
    [
      activeWorkspace,
      persistNichePref,
      syncProfileNiche,
      syncWorkspaceToProfile,
    ]
  );

  // Sync intelligence engine status from server (keys in .env.local).
  useEffect(() => {
    void getIntelligenceStatus().then((status) => {
      setEngineReady(status.ready);
    });
  }, []);

  // Refresh live niche feed when workspace/niche changes or feed becomes ready.
  useEffect(() => {
    if (phase !== "ready" || !engineReady) return;

    let cancelled = false;
    setFeedLoading(true);

    void refreshLiveOpportunityFeed(activeWorkspace, activeNiche).then(
      (result) => {
        if (cancelled) return;

        if (result.ok && result.opportunities.length > 0) {
          setAllOpportunities(result.opportunities);
          setFeedSource("live");
          setFeedStatus(undefined);
        } else if (result.error) {
          setFeedStatus(result.error);
        }
      }
    ).finally(() => {
      if (!cancelled) setFeedLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [phase, engineReady, activeWorkspace, activeNiche]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && phase === "ready") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, phase]);

  useEffect(() => {
    const lockScroll =
      phase === "onboarding" ||
      phase === "scanning" ||
      phase === "plan-select" ||
      Boolean(selectedOpportunity);
    document.body.style.overflow = lockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase, selectedOpportunity]);

  useEffect(() => {
    if (
      selectedOpportunity &&
      !filteredOpportunities.some((o) => o.id === selectedOpportunity.id)
    ) {
      setSelectedOpportunity(null);
    }
  }, [filteredOpportunities, selectedOpportunity]);

  const showFeed = phase === "ready";

  return (
    <>
      <AnimatePresence>
        {phase === "onboarding" && (
          <OnboardingModal
            key="onboarding"
            identity={draftIdentity}
            goal={draftGoal}
            nicheFocus={draftNicheFocus}
            niche={draftNiche}
            onIdentityChange={handleIdentityChange}
            onGoalChange={handleGoalChange}
            onNicheFocusChange={handleNicheFocusChange}
            onNicheChange={handleNicheChange}
            onInitialize={handleInitialize}
          />
        )}
      </AnimatePresence>

      <PlanSelectorModal
        open={phase === "plan-select"}
        onSelectFree={() => setPhase("ready")}
      />

      <AnimatePresence>
        {phase === "scanning" && draftNicheLabel && (
          <IntelligenceScanner
            key="scanner"
            nicheLabel={draftNicheLabel}
            onComplete={handleScanComplete}
          />
        )}
      </AnimatePresence>

      {phase !== "hydrating" && (
        <DashboardTopbar
          activeWorkspace={activeWorkspace}
          onActiveWorkspaceChange={handleActiveWorkspaceChange}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          onSearchSubmit={handleSearchSubmit}
          initialNotifications={initialNotifications}
        />
      )}

      <AnimatePresence mode="wait">
        {showFeed && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <h1 className="text-lg font-semibold text-white sm:text-xl">
                    Intelligence Feed
                  </h1>
                  <NicheSwitcher
                    activeWorkspace={activeWorkspace}
                    activeNiche={activeNiche}
                    activeNicheLabel={activeNicheLabel}
                    onNicheChange={handleNicheSwap}
                  />
                  <Badge
                    variant="outline"
                    className="border-[#deff9a]/30 bg-[#deff9a]/10 text-[10px] uppercase tracking-wider text-[#deff9a]"
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#deff9a]" />
                    {feedLoading
                      ? "Scanning Live Web…"
                      : resolveFeedSourceLabel(feedSource, engineReady)}
                  </Badge>
                </div>

                {feedStatus && !engineReady && (
                  <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-200/90">
                    {feedStatus}
                  </p>
                )}
                {feedStatus && engineReady && allOpportunities.length === 0 && (
                  <p className="mb-4 text-xs text-zinc-500">{feedStatus}</p>
                )}
                {feedStatus && engineReady && allOpportunities.length > 0 && feedSource !== "live" && (
                  <p className="mb-4 text-xs text-zinc-500">{feedStatus}</p>
                )}

                <motion.div
                  key={`${activeWorkspace}-${activeNiche}-${feedSource}-${allOpportunities.length}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-8">
                    <BuildInput />
                  </div>

                  {opportunityOfDay && (
                    <OpportunityOfDay
                      opportunity={opportunityOfDay}
                      onActNow={() => openOpportunity(opportunityOfDay)}
                    />
                  )}

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="glass-panel rounded-xl px-5 py-4 transition-all duration-300 hover:border-white/[0.12]"
                      >
                        <p className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500 sm:text-xs">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <TrendingSection
                      activeKeyword={keywordFilter}
                      onKeywordChange={setKeywordFilter}
                      trendingKeywords={contextFeed.trendingKeywords}
                      viralHooks={contextFeed.viralHooks}
                    />
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Ranked by demand momentum
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                        Discover Opportunities
                      </h2>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <Zap className="h-3.5 w-3.5 text-[#deff9a]" />
                      Click any row — insights from your live intelligence DB
                    </p>
                  </div>

                  <div className="mt-5">
                    <OpportunitiesFeed
                      key={`feed-${searchQuery}-${keywordFilter ?? "all"}`}
                      opportunities={filteredOpportunities}
                      activeId={selectedOpportunity?.id ?? null}
                      activeKeyword={keywordFilter}
                      searchQuery={searchQuery}
                      onSelect={openOpportunity}
                    />
                  </div>
                </motion.div>

                <p className="mt-10 border-t border-white/[0.04] pt-6 text-center text-[11px] text-zinc-600">
                  AIscoutX Intelligence Workspace ·{" "}
                  <Link
                    href="/"
                    className="text-zinc-500 underline-offset-4 transition-colors hover:text-[#deff9a] hover:underline"
                  >
                    Return to site
                  </Link>
                </p>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showFeed && (
        <OpportunityDrawer
          selectedOpportunity={selectedOpportunity}
          activeWorkspace={activeWorkspace}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
