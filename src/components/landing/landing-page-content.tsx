"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  Crown,
  Eye,
  FileText,
  Flame,
  LineChart,
  Megaphone,
  Radar,
  Rocket,
  ScanSearch,
  Sparkles,
  TrendingUp,
  User,
  Video,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { PricingCards } from "@/components/billing/pricing-cards";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FaqSection } from "@/components/landing/faq-section";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/landing/motion";
import { OpportunitySpotlight } from "@/components/landing/opportunity-spotlight";
import { WaitlistForm } from "@/components/waitlist-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Flame,
    indicator: "01",
    title: "Market Gap Intelligence",
    description:
      "Uncover real problems and underserved niches before markets get crowded—move while margins still exist.",
  },
  {
    icon: Megaphone,
    indicator: "02",
    title: "Instant Founder Blueprints",
    description:
      "Generate complete market research, UVP, TAM/SAM/SOM breakdown, and go-to-market strategies instantly.",
  },
  {
    icon: LineChart,
    indicator: "03",
    title: "Pitch Deck & Roadmap",
    description:
      "Transform raw ideas into investor-ready pitch decks and clear, actionable MVP execution roadmaps.",
  },
];

const steps = [
  {
    step: "01",
    icon: Radar,
    title: "Validate Idea",
    description:
      "AI scans live web signals, competitor gaps, and search demand to score your startup concept instantly.",
  },
  {
    step: "02",
    icon: ScanSearch,
    title: "Strategic Blueprint",
    description:
      "Get complete market analysis, TAM/SAM/SOM estimates, pricing strategy, and your MVP roadmap.",
  },
  {
    step: "03",
    icon: Zap,
    title: "AI Co-Founder Guidance",
    description:
      "Chat 24/7 with your dedicated AI mentor for pitch deck prep, execution tasks, and strategic decisions.",
  },
];

const platforms = ["Reddit", "X", "YouTube", "Google Search"];

const audiences = [
  {
    icon: Rocket,
    title: "First-Time Founders",
    description:
      "Get step-by-step startup handholding and strategic roadmaps without needing a technical co-founder.",
  },
  {
    icon: Video,
    title: "Non-Tech Creators",
    description:
      "Turn your audience insights into validated digital products and fundable SaaS concepts.",
  },
  {
    icon: User,
    title: "Solopreneurs",
    description:
      "Execute like a full team—from market research and UVP positioning to pitch deck creation.",
  },
  {
    icon: Building2,
    title: "Agencies & Studios",
    description:
      "Validate emerging service lines and tech opportunities before competitors enter the market.",
  },
];

const comingSoonCapabilities = [
  { icon: Bell, label: "AI Opportunity Alerts" },
  { icon: Eye, label: "Competitor Tracking" },
  { icon: Crown, label: "Founder Mode" },
  { icon: FileText, label: "Daily Intelligence Reports" },
];

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs text-zinc-500">
      {Icon && (
        <Icon
          className="h-3.5 w-3.5 text-[#deff9a] transition-transform duration-300"
          strokeWidth={1.5}
        />
      )}
      {children}
    </div>
  );
}

type LandingPageContentProps = {
  ctaHref: "/dashboard" | "/login?mode=signup";
};

export function LandingPageContent({ ctaHref }: LandingPageContentProps) {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-[480px] w-[min(100%,720px)] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.22)_0%,rgba(222,255,154,0.08)_35%,transparent_70%)] blur-3xl sm:h-[560px] sm:w-[900px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-32 z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(222,255,154,0.12)_0%,transparent_70%)] blur-2xl"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pb-12 sm:pt-20 md:pt-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <FadeIn delay={0}>
              <Badge
                variant="outline"
                className="mb-8 border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400 backdrop-blur-sm"
              >
                <Sparkles className="mr-1.5 inline h-3 w-3 text-[#deff9a]" />
                YOUR 24/7 AI STARTUP CO-FOUNDER
              </Badge>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
                <span className="text-gradient-hero block">
                  Build Your Startup With AI.
                </span>
                <span className="text-gradient-hero mt-1 block text-2xl opacity-90 sm:text-3xl md:text-4xl">
                  From Idea to Market & Pitch Deck.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:mt-8 md:text-xl">
                <span className="text-glow-lime font-semibold">AIscoutX</span>{" "}
                acts as your AI founder team—guiding you from idea validation to market analysis, MVP roadmaps, and pitch decks.
              </p>
            </FadeIn>

            <FadeIn delay={0.28} className="mt-10 w-full max-w-xl sm:mt-12">
              <Button
                asChild
                size="lg"
                className="btn-glow-lime h-12 rounded-xl bg-[#deff9a] px-8 text-base font-semibold text-black hover:bg-[#d8f992]"
              >
                <Link href={ctaHref}>Start Building Free →</Link>
              </Button>
            </FadeIn>
          </div>

          <FadeIn delay={0.1} className="relative z-10 mt-14 sm:mt-20 md:mt-24">
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">
              Product preview
            </p>
            <DashboardPreview />
          </FadeIn>

          <FadeIn delay={0.15} className="relative z-10 mt-10 sm:mt-14">
            <OpportunitySpotlight />
          </FadeIn>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section
        id="problem"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_50%,rgba(67,56,202,0.08),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <SectionLabel>The problem</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">
                The Execution Gap in Early-Stage Building
              </span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-zinc-500 sm:text-lg">
              Most non-technical founders struggle not from a lack of ideas, but from a lack of execution direction—spending weeks manually researching demand across{" "}
              {platforms.map((p, i) => (
                <span key={p}>
                  <span className="font-medium text-zinc-300">{p}</span>
                  {i < platforms.length - 1 ? ", " : ""}
                </span>
              ))}
              and building without clear blueprints.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-500 sm:text-lg">
              <span className="text-glow-lime font-semibold">AIscoutX</span>{" "}
              eliminates the trial-and-error—delivering validated blueprints, market data, and dedicated AI mentoring from day one.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel icon={TrendingUp}>Process</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">How it works</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
              From raw concept to structured execution in three simple steps.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3 md:gap-6">
            {steps.map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="glass-panel group relative h-full rounded-2xl p-6 transition-all duration-300 hover:border-[#deff9a]/20 sm:p-8"
                >
                  <span className="font-mono text-xs font-medium tracking-widest text-zinc-600">
                    Step {item.step}
                  </span>
                  <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors duration-300 group-hover:border-[#deff9a]/30 group-hover:bg-[#deff9a]/10">
                    <item.icon
                      className="h-5 w-5 text-[#deff9a] transition-transform duration-300 group-hover:scale-110"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {item.description}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Who Is This For? ─── */}
      <section
        id="audience"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(67,56,202,0.06),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel>Audience</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">Who is AIscoutX for?</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
              Designed for builders who need clarity, validation, and rapid execution.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {audiences.map((audience) => (
              <StaggerItem key={audience.title}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="glass-panel group h-full rounded-2xl p-6 transition-all duration-300 hover:border-[#deff9a]/20 sm:p-7"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors duration-300 group-hover:border-[#deff9a]/30 group-hover:bg-[#deff9a]/10">
                    <audience.icon
                      className="h-5 w-5 text-[#deff9a] transition-transform duration-300 group-hover:scale-110"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">
                    {audience.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {audience.description}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Coming Soon ─── */}
      <section
        id="coming-soon"
        className="relative border-t border-white/[0.06] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel icon={Sparkles}>Roadmap</SectionLabel>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Upcoming Founder Capabilities
            </h2>
          </FadeIn>

          <StaggerContainer className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {comingSoonCapabilities.map((cap) => (
              <StaggerItem key={cap.label}>
                <motion.div
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm transition-colors duration-300 hover:border-[#deff9a]/25 hover:bg-[#deff9a]/[0.06]"
                >
                  <cap.icon
                    className="h-3.5 w-3.5 text-[#deff9a] transition-transform duration-300"
                    strokeWidth={1.5}
                  />
                  <span>{cap.label}</span>
                  <Badge
                    variant="outline"
                    className="ml-1 border-white/10 bg-white/[0.02] px-1.5 py-0 text-[9px] uppercase tracking-wider text-zinc-500"
                  >
                    Soon
                  </Badge>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        id="features"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(51,65,85,0.15),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel icon={BarChart3}>Founder OS Engine</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">Execution modules that build startups</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base">
              Everything required to validate, structure, and present your business concept.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card className="card-premium group h-full border-0 bg-transparent shadow-none">
                  <CardHeader className="space-y-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent shadow-inner transition-all duration-500 group-hover:border-[#deff9a]/30 group-hover:shadow-[0_0_24px_rgba(222,255,154,0.12)]">
                        <feature.icon
                          className="h-5 w-5 text-[#deff9a] transition-transform duration-500 group-hover:scale-110"
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium tracking-widest text-zinc-600 transition-colors group-hover:text-[#deff9a]/60">
                        {feature.indicator}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-semibold tracking-tight text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section
        id="pricing"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(222,255,154,0.04),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">Invest in your AI Co-Founder</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
              200 credits refresh every month. Longer plans keep that same monthly refill.
            </p>
          </FadeIn>

          <div className="mx-auto mt-12 max-w-6xl">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <span className="text-gradient-hero">Common questions</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="mt-12">
            <FaqSection />
          </FadeIn>
        </div>
      </section>

      {/* ─── Founder Story ─── */}
      <section
        id="founder"
        className="relative border-t border-white/[0.06] py-20 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(51,65,85,0.12),transparent_55%)]"
        />
        <FadeIn className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionLabel>Our story</SectionLabel>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            <span className="text-gradient-hero">Why We Built AIscoutX</span>
          </h2>
          <blockquote className="mt-8 text-lg font-light leading-relaxed text-zinc-400 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-relaxed">
            &ldquo;Most non-technical founders fail due to execution ambiguity, not a lack of ideas. We built AIscoutX to give you a dedicated AI Co-Founder from day one.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-zinc-600">— The AIscoutX Team</p>
        </FadeIn>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-20">
        <FadeIn className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Ready to build with your AI Co-Founder?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Get started for free and generate your first startup blueprint today.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </FadeIn>
      </section>
    </>
  );
}