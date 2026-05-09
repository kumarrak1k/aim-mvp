"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PricingCurrency = "GBP" | "USD" | "EUR";

type PriceSet = { monthly: string; annual: string; annualMonthly: string };

const PROFESSIONAL: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£19",  annual: "£169",  annualMonthly: "£14.08" },
  USD: { monthly: "$25",  annual: "$209",  annualMonthly: "$17.42" },
  EUR: { monthly: "€22",  annual: "€189",  annualMonthly: "€15.75" },
};

const ADVANCED: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£29",  annual: "£249",  annualMonthly: "£20.75" },
  USD: { monthly: "$37",  annual: "$299",  annualMonthly: "$24.92" },
  EUR: { monthly: "€32",  annual: "€279",  annualMonthly: "€23.25" },
};

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

type StripePlanId =
  | "professional_monthly"
  | "professional_annual"
  | "advanced_monthly"
  | "advanced_annual";

async function redirectToCheckout(planId: StripePlanId): Promise<string | null> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) return null;
  const { url } = await res.json();
  return url ?? null;
}

export function CandidatePricingPlans({ currency = "GBP" }: { currency?: PricingCurrency }) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const pro = PROFESSIONAL[currency];
  const adv = ADVANCED[currency];

  const plans = [
    {
      name: "Free",
      monthlyPrice: "Free",
      annualPrice: null as string | null,
      annualMonthly: null as string | null,
      period: null as string | null,
      description: "Try the platform and run your first practice sessions with no commitment.",
      features: [
        "3 interview practice sessions per month",
        "Basic answer feedback",
        "Session transcript review",
      ],
      cta: "Start free",
      ctaHref: "/for-candidates/sign-up",
      stripePlanMonthly: null as StripePlanId | null,
      stripePlanAnnual: null as StripePlanId | null,
      highlight: false,
    },
    {
      name: "Professional",
      monthlyPrice: pro.monthly,
      annualPrice: pro.annual,
      annualMonthly: pro.annualMonthly,
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
      stripePlanMonthly: "professional_monthly" as StripePlanId,
      stripePlanAnnual: "professional_annual" as StripePlanId,
      highlight: true,
    },
    {
      name: "Advanced",
      monthlyPrice: adv.monthly,
      annualPrice: adv.annual,
      annualMonthly: adv.annualMonthly,
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
      stripePlanMonthly: "advanced_monthly" as StripePlanId,
      stripePlanAnnual: "advanced_annual" as StripePlanId,
      highlight: false,
    },
  ];

  async function handlePaidCta(plan: (typeof plans)[number]) {
    const stripePlanId = annual ? plan.stripePlanAnnual : plan.stripePlanMonthly;
    if (!stripePlanId) return;
    setLoadingPlan(plan.name);
    try {
      const url = await redirectToCheckout(stripePlanId);
      if (url) {
        router.push(url);
      } else {
        router.push(plan.ctaHref);
      }
    } finally {
      setLoadingPlan(null);
    }
  }

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
            Save up to 28%
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice =
            annual && plan.annualPrice ? plan.annualMonthly! : plan.monthlyPrice;
          const displayPeriod =
            annual && plan.annualPrice ? "/month, billed annually" : plan.period;
          const annualTotal = annual && plan.annualPrice;
          const isPaid = plan.stripePlanMonthly !== null;
          const isLoading = loadingPlan === plan.name;

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
              {annualTotal && (
                <p className="mt-1 text-xs text-gray-500">{plan.annualPrice} billed annually</p>
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

              {PAYMENTS_ENABLED && isPaid ? (
                <button
                  onClick={() => handlePaidCta(plan)}
                  disabled={isLoading}
                  className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {isLoading ? "Redirecting…" : plan.cta}
                </button>
              ) : (
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
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
