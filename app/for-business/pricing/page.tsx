import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-business/pricing",
  title: "Hiring Team Pricing — AI Career Mentor for Business",
  description:
    "Pricing for the AI assessment platform. Per-seat plans for small teams, custom enterprise pricing for high-volume hiring.",
  keywords: [
    "AI assessment platform pricing",
    "talent assessment pricing",
    "recruiter platform pricing",
    "enterprise hiring software pricing",
  ],
});

const plans = [
  {
    name: "Team",
    price: "£49",
    period: "/month",
    description:
      "For small hiring teams running structured assessments — up to 5 recruiters, 100 candidate invites per month.",
    features: [
      "Up to 5 recruiter seats",
      "100 candidate invites / month",
      "Unlimited assessment templates",
      "Full results dashboard",
      "Email invite branding",
      "UK GDPR-ready",
    ],
    cta: "Start free trial",
    ctaHref: "/for-business/sign-up",
    highlight: false,
  },
  {
    name: "Business",
    price: "£149",
    period: "/month",
    description:
      "For growing hiring teams. More seats, more volume, advanced reporting.",
    features: [
      "Up to 15 recruiter seats",
      "500 candidate invites / month",
      "Unlimited templates",
      "Advanced result analytics",
      "Custom branding (logo + colour)",
      "Priority email support",
    ],
    cta: "Start free trial",
    ctaHref: "/for-business/sign-up",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: null,
    description:
      "For high-volume hiring, regulated industries, or assessment centres at scale.",
    features: [
      "Unlimited recruiter seats",
      "Unlimited candidate invites",
      "Custom competency frameworks",
      "Single sign-on (SSO)",
      "Dedicated CSM and onboarding",
      "Data Processing Agreement (DPA)",
      "SLA + priority support",
    ],
    cta: "Talk to our team",
    ctaHref: "/for-business/sign-up",
    highlight: false,
  },
];

export default function BusinessPricingPage() {
  return (
    <AudienceShell audience="business" currentPath="/for-business/pricing">
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pt-16">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
          Hiring team pricing
        </p>
        <h1 className="text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl">
          Pricing that scales with your hiring volume.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Per-seat plans for small teams, custom pricing for enterprise.
          Start with a free trial, no credit card.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[2rem] border p-7 shadow-2xl ${
                plan.highlight
                  ? "border-fuchsia-300/30 bg-fuchsia-300/[0.08] shadow-fuchsia-950/20"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              {plan.highlight && (
                <span className="mb-5 inline-flex self-start rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                  Most popular
                </span>
              )}
              {!plan.highlight && <div className="mb-5 h-7" />}

              <h3 className="text-xl font-black tracking-[-0.03em]">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-5xl font-black leading-none tracking-[-0.07em]">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="mb-1.5 text-sm text-gray-500">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-4 min-h-[60px] text-sm leading-6 text-gray-400">
                {plan.description}
              </p>
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-gray-300"
                  >
                    <span
                      className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${
                        plan.highlight ? "text-fuchsia-400" : "text-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href={plan.ctaHref}
                className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-fuchsia-950/35 hover:scale-[1.02]"
                    : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <p className="text-sm leading-6 text-gray-500">
          Looking for the candidate plan? See{" "}
          <Link
            href="/for-candidates/pricing"
            className="font-black text-purple-300 hover:text-purple-200"
          >
            candidate pricing →
          </Link>
        </p>
      </section>
    </AudienceShell>
  );
}
