"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  Check,
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

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FaqSection } from "@/components/landing/faq-section";
import {
  FadeIn,
  GlowHoverCard,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Flame,
    indicator: "01",
    title: "Exploding Opportunities",
    description:
      "Surface trends and niches accelerating before they hit mainstream feeds—move while margins still exist.",
  },
  {
    icon: Megaphone,
    indicator: "02",
    title: "Viral Hooks",
    description:
      "Scroll-stopping angles distilled from what’s already winning—ready for your next post or launch.",
  },
  {
    icon: LineChart,
    indicator: "03",
    title: "Opportunity Scores",
    description:
      "Every signal ranked by momentum, competition, and upside—build what matters, skip the guesswork.",
  },
];

const steps = [
  {
    step: "01",
    icon: Radar,
    title: "Scan",
    description:
      "AI monitors thousands of discussions across Reddit, X, and YouTube—24 hours a day, 7 days a week.",
  },
  {
    step: "02",
    icon: ScanSearch,
    title: "Analyze",
    description:
      "Our engine identifies growth patterns, calculates demand metrics, and scores every opportunity.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Act",
    description:
      "Get the exact trends, hooks, and recommended actions before they go mainstream.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "Perfect for solo founders testing the waters.",
    features: ["Daily Briefing", "5 Keywords", "Email alerts"],
    cta: "Get Starter",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For creators and founders who move fast.",
    features: ["Viral Hooks", "Full Access", "Weekly deep dives", "Priority signals"],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    description: "Built for teams managing multiple brands.",
    features: [
      "Team Management",
      "Custom Monitoring",
      "White-label reports",
      "Dedicated support",
    ],
    cta: "Get Agency",
    popular: false,
  },
];

const platforms = ["Reddit", "X", "YouTube"];

const audiences = [
  {
    icon: Video,
    title: "Creators",
    description:
      "Find content opportunities before trends explode across platforms.",
  },
  {
    icon: Rocket,
    title: "Founders",
    description:
      "Discover startup opportunities with growing demand and low competition.",
  },
  {
    icon: Building2,
    title: "Agencies",
    description:
      "Spot emerging services your clients will soon need—before competitors do.",
  },
  {
    icon: User,
    title: "Solopreneurs",
    description:
      "Find profitable opportunities before markets get crowded and margins shrink.",
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

function PricingCard({
  plan,
}: {
  plan: (typeof pricingPlans)[number];
}) {
  const cardInner = (
    <div
      className={`card-premium relative z-10 flex h-full flex-col rounded-2xl transition-all duration-300 ${
        plan.popular
          ? "border-[#deff9a]/30 shadow-[0_0_48px_rgba(222,255,154,0.12)] hover:border-[#deff9a]/50 hover:shadow-[0_0_64px_rgba(222,255,154,0.22)]"
          : "hover:border-white/[0.15]"
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
          <Badge className="border-[#deff9a]/30 bg-[#deff9a] text-black hover:bg-[#deff9a]">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-lg font-semibold text-white">
          {plan.name}
        </CardTitle>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-white">
            {plan.price}
          </span>
          <span className="text-sm text-zinc-500">{plan.period}</span>
        </div>
        <CardDescription className="mt-2 text-sm text-zinc-500">
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-zinc-400"
            >
              <Check
                className="h-4 w-4 shrink-0 text-[#deff9a] transition-transform duration-300"
                strokeWidth={1.5}
              />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          className={`w-full rounded-xl transition-all duration-300 ${
            plan.popular
              ? "btn-glow-lime bg-[#deff9a] text-black hover:bg-[#d8f992]"
              : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
          variant={plan.popular ? "default" : "outline"}
          asChild
        >
          <a href="#waitlist">{plan.cta}</a>
        </Button>
      </CardFooter>
    </div>
  );

  if (plan.popular) {
    return (
      <GlowHoverCard
        className={`relative flex flex-col border-0 bg-transparent shadow-none lg:-mt-2 lg:mb-2`}
      >
        <div className="absolute -inset-px z-0 rounded-2xl bg-gradient-to-b from-[#deff9a]/40 via-[#deff9a]/10 to-transparent opacity-70 blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />
        {cardInner}
      </GlowHoverCard>
    );
  }

  return (
    <Card className="relative flex flex-col border-0 bg-transparent shadow-none">
      {cardInner}
    </Card>
  );
}

type LandingPageContentProps = {
  ctaHref: "/dashboard" | "/login";
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
                AI Founder Operating System
              </Badge>
            </FadeIn>

            <FadeIn delay={0.08}>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
                <span className="text-gradient-hero block">
                  Build Your Startup With AI.
                </span>
                <span className="text-gradient-hero mt-1 block text-2xl opacity-90 sm:text-3xl md:text-4xl">
                  From idea to first customer.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:mt-8 md:text-xl">
                <span className="text-glow-lime font-semibold">AIscoutX</span>{" "}
                acts as your AI founder team—guiding you from validation to MVP,
                launch, and first revenue.
              </p>
            </FadeIn>

            <FadeIn delay={0.28} className="mt-10 w-full max-w-xl sm:mt-12">
              <Button
                asChild
                size="lg"
                className="btn-glow-lime h-12 rounded-xl bg-[#deff9a] px-8 text-base font-semibold text-black hover:bg-[#d8f992]"
              >
                <Link href={ctaHref}>Start Building →</Link>
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
                The Information Overload Trap
              </span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-zinc-500 sm:text-lg">
              Millions of discussions happen every day on{" "}
              {platforms.map((p, i) => (
                <span key={p}>
                  <span className="font-medium text-zinc-300">{p}</span>
                  {i < platforms.length - 1 ? ", " : ""}
                </span>
              ))}
              —but most founders discover trends weeks too late, when
              competition is already fierce and margins are gone.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-500 sm:text-lg">
              <span className="text-glow-lime font-semibold">AIscoutX</span>{" "}
              filters this noise into clear, scored signals—so you see what
              matters before everyone else piles in.
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
              From raw conversations to actionable intelligence in three steps.
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
              Built for operators who need signal—not more noise.
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
              Coming Soon Capabilities
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
            <SectionLabel icon={BarChart3}>Intelligence stack</SectionLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="text-gradient-hero">Signals that compound</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base">
              Everything you need to act before the crowd—not after the hype.
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
              <span className="text-gradient-hero">Invest in your edge</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
              Simple plans. Cancel anytime. Stripe-ready at launch.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {pricingPlans.map((plan) => (
              <StaggerItem key={plan.name}>
                <PricingCard plan={plan} />
              </StaggerItem>
            ))}
          </StaggerContainer>
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
            &ldquo;Most founders and creators discover trends after everyone
            else. We built this to give you the ultimate decision-making
            edge.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-zinc-600">— The AIscoutX Team</p>
        </FadeIn>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-20">
        <FadeIn className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Ready to scout smarter?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Join early access and get your first briefing free.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </FadeIn>
      </section>
    </>
  );
}
