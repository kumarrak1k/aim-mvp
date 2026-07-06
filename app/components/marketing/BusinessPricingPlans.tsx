"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PricingCurrency = "GBP" | "USD" | "EUR";

type PriceSet = { monthly: string; annual: string; annualMonthly: string };

const TEAM: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£149",  annual: "£1,193", annualMonthly: "£99.42"  },
  USD: { monthly: "$179",  annual: "$1,432", annualMonthly: "$119.33" },
  EUR: { monthly: "€169",  annual: "€1,352", annualMonthly: "€112.67" },
};

const BUSINESS: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£399",  annual: "£3,192", annualMonthly: "£266.00" },
  USD: { monthly: "$479",  annual: "$3,832", annualMonthly: "$319.33" },
  EUR: { monthly: "€449",  annual: "€3,592", annualMonthly: "€299.33" },
};

type PlanKey = "team" | "business" | "enterprise";

// Side-by-side feature comparison for hiring teams.
const COMPARE: Array<{ feature: string; team: string | boolean; business: string | boolean; enterprise: string | boolean }> = [
  { feature: "Recruiter seats", team: "3", business: "10", enterprise: "Unlimited" },
  { feature: "Candidate invites / month", team: "100", business: "500", enterprise: "Unlimited" },
  { feature: "Assessment templates", team: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
  { feature: "Results dashboard", team: true, business: true, enterprise: true },
  { feature: "Advanced result analytics", team: false, business: true, enterprise: true },
  { feature: "Custom branding", team: "Email", business: "Logo + colour", enterprise: "Full" },
  { feature: "Custom competency frameworks", team: false, business: false, enterprise: true },
  { feature: "Single sign-on (SSO)", team: false, business: false, enterprise: true },
  { feature: "DPA + SLA", team: false, business: false, enterprise: true },
  { feature: "Support", team: "Email", business: "Priority email", enterprise: "Dedicated CSM" },
];

function renderCell(v: string | boolean) {
  if (typeof v === "boolean") {
    return v ? (
      <span className="text-emerald-400" aria-label="Included">✓</span>
    ) : (
      <span className="text-gray-600" aria-label="Not included">–</span>
    );
  }
  return <span className="text-gray-200">{v}</span>;
}

export function BusinessPricingPlans({ currency = "GBP" }: { currency?: PricingCurrency }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const router = useRouter();
  const team = TEAM[currency];
  const biz = BUSINESS[currency];

  function handleCheckout(planKey: "team" | "business") {
    setLoading(planKey);
    // Corporate billing belongs to a workspace (seats, invites, branding), so a
    // company must exist before we can charge. Send buyers through sign-up →
    // workspace onboarding, where they choose a plan and pay via the
    // workspace-scoped checkout (which correctly syncs the Company record).
    // Stash their selection so onboarding can pre-fill it.
    try {
      sessionStorage.setItem(
        "aim_corp_plan",
        JSON.stringify({ plan: planKey, billing: annual ? "annual" : "monthly" })
      );
    } catch {
      /* sessionStorage unavailable — onboarding just won't pre-fill */
    }
    router.push("/for-business/sign-up");
  }

  const plans = [
    {
      planKey: "team" as PlanKey,
      name: "Team",
      monthlyPrice: team.monthly,
      annualPrice: team.annual,
      annualMonthly: team.annualMonthly,
      period: "/month",
      description:
        "For small hiring teams running structured assessments: up to 3 recruiters, 100 candidate invites per month. Start with a 14-day free trial, no payment details required.",
      features: [
        "14-day free trial: no payment details, 10 invites to evaluate",
        "Up to 3 recruiter seats",
        "100 candidate invites / month",
        "Unlimited assessment templates",
        "Full results dashboard",
        "Email invite branding",
        "UK GDPR-ready",
      ],
      cta: "Get started",
      ctaType: "checkout" as const,
      highlight: false,
    },
    {
      planKey: "business" as PlanKey,
      name: "Business",
      monthlyPrice: biz.monthly,
      annualPrice: biz.annual,
      annualMonthly: biz.annualMonthly,
      period: "/month",
      description:
        "For growing hiring teams. More seats, more volume, advanced reporting.",
      features: [
        "Up to 10 recruiter seats",
        "500 candidate invites / month",
        "Unlimited templates",
        "Advanced result analytics",
        "Custom branding (logo + colour)",
        "Priority email support",
      ],
      cta: "Get started",
      ctaType: "checkout" as const,
      highlight: true,
    },
    {
      planKey: "enterprise" as PlanKey,
      name: "Enterprise",
      monthlyPrice: "Custom",
      annualPrice: null as string | null,
      annualMonthly: null as string | null,
      period: null as string | null,
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
      ctaType: "link" as const,
      ctaHref: "/contact",
      highlight: false,
    },
  ];

  return (
    <>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${!annual ? "text-white" : "text-gray-500"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          aria-pressed={annual}
          className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
            annual
              ? "border-purple-400/40 bg-purple-500/30"
              : "border-white/10 bg-white/[0.07]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-semibold ${annual ? "text-white" : "text-gray-500"}`}>
          Annual
        </span>
        {annual && (
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-300">
            Save up to 33%
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice =
            annual && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice;
          const displayPeriod =
            annual && plan.annualPrice ? "/year" : plan.period;
          const annualMonthlyEquiv = annual && plan.annualMonthly;
          const isLoading = loading === plan.planKey;

          return (
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

              <h3 className="text-xl font-black tracking-[-0.03em]">{plan.name}</h3>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-5xl font-black leading-none tracking-[-0.07em]">
                  {displayPrice}
                </span>
                {displayPeriod && (
                  <span className="mb-1.5 text-sm text-gray-500">{displayPeriod}</span>
                )}
              </div>
              {annualMonthlyEquiv && (
                <p className="mt-1 text-xs text-gray-500">
                  {plan.annualMonthly}/month, charged as a single annual payment
                </p>
              )}
              <p className="mt-4 min-h-[60px] text-sm leading-6 text-gray-400">
                {plan.description}
              </p>
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
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

              {plan.ctaType === "checkout" ? (
                <button
                  onClick={() => handleCheckout(plan.planKey as "team" | "business")}
                  disabled={isLoading || loading !== null}
                  className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {isLoading ? "Redirecting…" : plan.cta}
                </button>
              ) : (
                <Link
                  href={(plan as { ctaHref: string }).ctaHref}
                  className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan comparison matrix */}
      <div className="mx-auto mt-14 max-w-5xl">
        <h3 className="mb-6 text-center text-2xl font-black tracking-[-0.04em]">Compare plans</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th scope="col" className="px-4 py-3 text-left font-black text-gray-300">Feature</th>
                <th scope="col" className="px-4 py-3 text-center font-black text-gray-300">Team</th>
                <th scope="col" className="px-4 py-3 text-center font-black text-purple-200">Business</th>
                <th scope="col" className="px-4 py-3 text-center font-black text-gray-300">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {COMPARE.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 text-left text-gray-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center">{renderCell(row.team)}</td>
                  <td className="bg-purple-300/[0.04] px-4 py-3 text-center">{renderCell(row.business)}</td>
                  <td className="px-4 py-3 text-center">{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
