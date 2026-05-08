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
  title: "AI Interview Coach Pricing",
  description:
    "Simple pricing for AI interview coaching across mock interview practice, answer feedback, voice delivery and camera presence.",
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
    name: "Starter",
    price: "Free",
    description:
      "A good entry point for trying the platform and understanding the practice flow.",
    features: [
      "AI-generated interview questions",
      "Basic answer feedback",
      "Simple mock interview experience",
    ],
    cta: "Start Practising",
    ctaHref: "/practice",
    highlight: false,
    enterprise: false,
  },
  {
    name: "Coach",
    price: "£9",
    description:
      "Best for candidates actively preparing for upcoming interviews and wanting deeper support.",
    features: [
      "Voice delivery analysis",
      "Camera presence insight",
      "Better structured feedback",
      "Session performance summary",
    ],
    cta: "Start Practising",
    ctaHref: "/practice",
    highlight: true,
    enterprise: false,
  },
  {
    name: "Pro",
    price: "£19",
    description:
      "Designed for more serious preparation and repeated improvement across multiple sessions.",
    features: [
      "Everything in Coach",
      "More advanced reporting",
      "Deeper practice support",
      "Profile-led preparation journeys",
    ],
    cta: "Start Practising",
    ctaHref: "/practice",
    highlight: false,
    enterprise: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description:
      "For talent teams, assessment centres, and HR departments running structured evaluation at scale.",
    features: [
      "Unlimited candidate assessments",
      "Custom assessment templates",
      "Competency framework integration",
      "Recruiter dashboard & team access",
      "Bulk candidate invite management",
      "White-label branding options",
      "Priority support & onboarding",
      "Data Processing Agreement (DPA)",
    ],
    cta: "Talk to sales",
    ctaHref: "/enterprise",
    highlight: false,
    enterprise: true,
  },
];

export default function PricingPage() {
  return (
    <MarketingShell currentPath="/pricing">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title="Simple pricing for stronger interview preparation."
          description="Choose a plan that fits how seriously you are preparing. The goal is simple: give candidates a clearer path to better interview performance."
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[2rem] border p-6 shadow-2xl ${
                plan.highlight
                  ? "border-purple-300/30 bg-purple-300/10 shadow-purple-950/20"
                  : plan.enterprise
                  ? "border-fuchsia-300/20 bg-fuchsia-300/[0.04] shadow-black/10"
                  : "border-white/10 bg-white/[0.05] shadow-black/10"
              }`}
            >
              {plan.highlight && (
                <span className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                  Most popular
                </span>
              )}
              {plan.enterprise && (
                <span className="mb-4 inline-flex rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-black text-fuchsia-300">
                  For teams
                </span>
              )}

              <h3 className="text-2xl font-black tracking-[-0.04em]">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black tracking-[-0.06em]">
                  {plan.price}
                </span>
                {plan.price !== "Free" && plan.price !== "Custom" && (
                  <span className="mb-2 text-sm text-gray-400">/month</span>
                )}
                {plan.price === "Custom" && (
                  <span className="mb-2 text-sm text-gray-400">pricing</span>
                )}
              </div>

              <p className="mt-4 min-h-[88px] leading-7 text-gray-300">
                {plan.description}
              </p>

              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-sm leading-7 text-gray-300">
                    ✓ {feature}
                  </p>
                ))}
              </div>

              <Link
                href={plan.ctaHref}
                className={`mt-7 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                    : plan.enterprise
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-purple-950/25 hover:scale-[1.02]"
                    : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1400&q=80"
              alt="Professional reviewing subscription and planning options"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>

          <GlassCard>
            <SectionHeading
              eyebrow="Value"
              title="Pay for clearer practice, not more confusion."
              description="The value is in helping candidates improve with more structure, better feedback and a more polished preparation experience."
            />

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-center text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] sm:w-auto"
              >
                Go to practice
              </Link>

              <Link
                href="/platform"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-center text-base font-black text-white transition hover:bg-white/[0.1] sm:w-auto"
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