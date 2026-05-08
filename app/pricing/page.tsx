import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import {
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

export const metadata: Metadata = createPageMetadata({
  path: "/pricing",
  title: "AI Interview Coach Pricing — Free to Start",
  description:
    "Transparent pricing for AI interview coaching. Start free, then unlock full feedback, voice delivery analysis, camera presence review and progress tracking.",
  keywords: [
    "AI interview coach pricing",
    "mock interview pricing",
    "AI career coach pricing",
    "interview preparation subscription",
    "AI interview practice plans",
  ],
});

const plans = [
  {
    name: "Free",
    price: "£0",
    period: null,
    badge: null,
    badgeStyle: null,
    description: "Explore the platform and complete your first practice sessions with no commitment.",
    features: [
      "3 practice sessions per month",
      "AI-generated tailored questions",
      "Basic answer feedback",
      "Session transcript review",
    ],
    cta: "Start for free",
    ctaHref: "/practice",
    highlight: false,
    enterprise: false,
  },
  {
    name: "Professional",
    price: "£9",
    period: "/month",
    badge: "Most popular",
    badgeStyle: "popular",
    description: "For candidates actively preparing for upcoming interviews who want the full coaching suite.",
    features: [
      "Unlimited practice sessions",
      "Voice delivery analysis — pace, clarity, filler words",
      "Camera presence review — eye contact and posture",
      "Full structured feedback on every answer",
      "Model answers for direct comparison",
      "Session performance summary",
      "Progress history saved and tracked",
    ],
    cta: "Start Practising",
    ctaHref: "/practice",
    highlight: true,
    enterprise: false,
  },
  {
    name: "Advanced",
    price: "£19",
    period: "/month",
    badge: "Most thorough",
    badgeStyle: "advanced",
    description: "For intensive preparation across multiple rounds, roles or a sustained job search.",
    features: [
      "Everything in Professional",
      "Advanced session analytics",
      "Competency gap tracking across sessions",
      "Extended session depth and question variety",
      "Profile-led preparation journeys",
      "Priority coaching queue",
    ],
    cta: "Start Practising",
    ctaHref: "/practice",
    highlight: false,
    enterprise: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: null,
    badge: "For teams",
    badgeStyle: "enterprise",
    description: "For talent teams, assessment centres and HR departments running structured evaluation at scale.",
    features: [
      "Unlimited candidate assessments",
      "Custom interview templates per role",
      "Competency framework integration",
      "Recruiter dashboard and team access",
      "Bulk candidate invite management",
      "White-label branding options",
      "Data Processing Agreement (DPA)",
      "Priority support and onboarding",
    ],
    cta: "Talk to our team",
    ctaHref: "/enterprise",
    highlight: false,
    enterprise: true,
  },
];

const includedEverywhere = [
  "UK data residency",
  "GDPR compliant",
  "No credit card to start",
  "Cancel any time",
];

export default function PricingPage() {
  return (
    <MarketingShell currentPath="/pricing">

      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title="Start free. Upgrade when the interview matters."
          description="Every plan is built around one goal: arriving at your next interview sharper and more prepared than your competition."
        />

        {/* Included everywhere pills */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {includedEverywhere.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-400"
            >
              ✓ {item}
            </span>
          ))}
        </div>
      </section>

      {/* Plans grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      {/* FAQ / value section */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1400&q=80"
              alt="Professional reviewing preparation options before an important interview"
              className="h-full min-h-[380px] w-full object-cover"
            />
          </GlassCard>

          <GlassCard>
            <SectionHeading
              eyebrow="Why it's worth it"
              title="One focused session. Real preparation, real results."
              description="Most candidates walk into interviews underprepared. The ones who get offers practised with honest, specific feedback — not vague encouragement."
            />

            <div className="mt-7 space-y-4">
              {[
                {
                  q: "What is included in the free plan?",
                  a: "Three complete practice sessions per month with AI-generated questions, basic answer feedback and transcript review.",
                },
                {
                  q: "Can I cancel at any time?",
                  a: "Yes. Cancel any time from your account settings with no penalty or hidden fees.",
                },
                {
                  q: "Is my data shared with employers?",
                  a: "Never. Your CV, answers and session data remain private. You can delete everything from your account at any time.",
                },
                {
                  q: "How does Enterprise pricing work?",
                  a: "Enterprise is priced by team size and volume. Contact us for a tailored quote based on your hiring needs.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-[1.4rem] border border-white/[0.08] bg-black/20 p-5">
                  <p className="text-sm font-black text-white">{q}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{a}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-center text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] sm:w-auto"
              >
                Start free
              </Link>
              <Link
                href="/platform"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.1] sm:w-auto"
              >
                View platform
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

    </MarketingShell>
  );
}

type Plan = (typeof plans)[number];

function PlanCard({ plan }: { plan: Plan }) {
  const badgeClasses: Record<string, string> = {
    popular: "bg-white text-black",
    advanced: "border border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
    enterprise: "border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
  };

  const cardClasses = plan.highlight
    ? "border-purple-300/30 bg-purple-300/[0.08] shadow-purple-950/20"
    : plan.enterprise
    ? "border-fuchsia-300/20 bg-fuchsia-300/[0.04]"
    : "border-white/10 bg-white/[0.04]";

  const ctaClasses = plan.highlight
    ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
    : plan.enterprise
    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-purple-950/25 hover:scale-[1.02]"
    : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]";

  return (
    <div className={`relative flex flex-col rounded-[2rem] border p-7 shadow-2xl ${cardClasses}`}>
      {/* Badge */}
      {plan.badge && plan.badgeStyle && (
        <span
          className={`mb-5 inline-flex self-start rounded-full px-3 py-1 text-xs font-black ${badgeClasses[plan.badgeStyle] ?? ""}`}
        >
          {plan.badge}
        </span>
      )}
      {!plan.badge && <div className="mb-5 h-7" />}

      {/* Name */}
      <h3 className="text-xl font-black tracking-[-0.03em]">{plan.name}</h3>

      {/* Price */}
      <div className="mt-3 flex items-end gap-1.5">
        <span className="text-5xl font-black leading-none tracking-[-0.07em]">{plan.price}</span>
        {plan.period && (
          <span className="mb-1.5 text-sm text-gray-500">{plan.period}</span>
        )}
        {plan.price === "Custom" && (
          <span className="mb-1.5 text-sm text-gray-500">pricing</span>
        )}
      </div>

      {/* Description */}
      <p className="mt-4 min-h-[72px] text-sm leading-6 text-gray-400">{plan.description}</p>

      {/* Features */}
      <div className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${
                plan.highlight
                  ? "text-purple-400"
                  : plan.enterprise
                  ? "text-fuchsia-400"
                  : "text-gray-500"
              }`}
            >
              <path
                d="M3 8l4 4 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feature}
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition ${ctaClasses}`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
