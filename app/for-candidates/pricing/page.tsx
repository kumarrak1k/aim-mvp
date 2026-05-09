import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-candidates/pricing",
  title: "Candidate Pricing — AI Career Mentor",
  description:
    "Transparent candidate pricing for AI interview practice and assessment centre coaching. Free to start, then unlock unlimited sessions.",
  keywords: [
    "AI interview coach pricing",
    "assessment centre pricing",
    "candidate subscription",
    "interview practice plans",
  ],
});

const plans = [
  {
    name: "Free",
    price: "£0",
    period: null,
    description:
      "Try the platform and run your first practice sessions with no commitment.",
    features: [
      "3 interview practice sessions per month",
      "Basic answer feedback",
      "Session transcript review",
    ],
    cta: "Start free",
    ctaHref: "/for-candidates/sign-up",
    highlight: false,
  },
  {
    name: "Professional",
    price: "£9",
    period: "/month",
    description:
      "For candidates actively preparing — unlimited interview practice, full feedback suite, voice and camera analysis.",
    features: [
      "Unlimited interview practice sessions",
      "Voice delivery and camera presence analysis",
      "Full structured feedback per answer",
      "Model answers per question",
      "Progress history saved and tracked",
    ],
    cta: "Start free trial",
    ctaHref: "/for-candidates/sign-up",
    highlight: true,
  },
  {
    name: "Advanced",
    price: "£19",
    period: "/month",
    description:
      "For intensive preparation — adds the mock assessment centre, advanced analytics and priority support.",
    features: [
      "Everything in Professional",
      "Mock assessment centre (case study + interview + presentation)",
      "Advanced session analytics",
      "Competency gap tracking across sessions",
      "Priority coaching queue",
    ],
    cta: "Start free trial",
    ctaHref: "/for-candidates/sign-up",
    highlight: false,
  },
];

export default function CandidatePricingPage() {
  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/pricing">
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pt-16">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
          Candidate pricing
        </p>
        <h1 className="text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl">
          Start free. Upgrade when the interview matters.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Plans are built around how seriously you&rsquo;re preparing — from
          first-time practice to full assessment centre prep.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[2rem] border p-7 shadow-2xl ${
                plan.highlight
                  ? "border-purple-300/30 bg-purple-300/[0.08] shadow-purple-950/20"
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
                        plan.highlight ? "text-purple-400" : "text-gray-500"
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
                    ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
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
          Looking for the hiring-team plan? See{" "}
          <Link
            href="/for-business/pricing"
            className="font-black text-fuchsia-300 hover:text-fuchsia-200"
          >
            business pricing →
          </Link>
        </p>
      </section>
    </AudienceShell>
  );
}
