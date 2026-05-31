"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PricingCurrency = "GBP" | "USD" | "EUR";

type PriceSet = { monthly: string; annual: string; annualMonthly: string };

const PLUS: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£19",  annual: "£169",  annualMonthly: "£14.08" },
  USD: { monthly: "$25",  annual: "$209",  annualMonthly: "$17.42" },
  EUR: { monthly: "€22",  annual: "€189",  annualMonthly: "€15.75" },
};

const PROFESSIONAL: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£29",  annual: "£249",  annualMonthly: "£20.75" },
  USD: { monthly: "$37",  annual: "$299",  annualMonthly: "$24.92" },
  EUR: { monthly: "€32",  annual: "€279",  annualMonthly: "€23.25" },
};

type StripePlanId =
  | "plus_monthly"
  | "plus_annual"
  | "professional_monthly"
  | "professional_annual";

type PlanFeature = { text: string; isNew?: boolean };

export function CandidatePricingPlans({ currency = "GBP" }: { currency?: PricingCurrency }) {
  const [annual, setAnnual] = useState(false);
  const router = useRouter();

  const pro = PLUS[currency];
  const adv = PROFESSIONAL[currency];

  const plans = [
    {
      name: "Free",
      monthlyPrice: "Free",
      annualPrice: null as string | null,
      annualMonthly: null as string | null,
      period: null as string | null,
      description: "Start with a 7-day full-access trial — voice, camera and assessment centres, no card. Then continue free with 3 keyboard-only practice sessions.",
      features: [
        { text: "7-day full-access trial included — no card", isNew: true },
        { text: "Then 3 keyboard-only practice sessions" },
        { text: "AI-generated tailored interview questions" },
        { text: "Written answer feedback per question" },
        { text: "Session transcript review" },
      ] as PlanFeature[],
      cta: "Start 7-day free trial",
      stripePlanMonthly: null as StripePlanId | null,
      stripePlanAnnual: null as StripePlanId | null,
      highlight: false,
    },
    {
      name: "Plus",
      monthlyPrice: pro.monthly,
      annualPrice: pro.annual,
      annualMonthly: pro.annualMonthly,
      period: "/month",
      description:
        "For candidates actively preparing — unlimited practice with full feedback, voice interview and camera analysis.",
      features: [
        { text: "Unlimited interview practice sessions" },
        { text: "All 3 interview modes: typed, voice and voice + camera" },
        { text: "Voice delivery and camera presence analysis" },
        { text: "Full structured feedback per answer" },
        { text: "Model answers per question" },
        { text: "Progress history saved and tracked" },
      ] as PlanFeature[],
      cta: "Get started",
      stripePlanMonthly: "plus_monthly" as StripePlanId,
      stripePlanAnnual: "plus_annual" as StripePlanId,
      highlight: true,
    },
    {
      name: "Professional",
      monthlyPrice: adv.monthly,
      annualPrice: adv.annual,
      annualMonthly: adv.annualMonthly,
      period: "/month",
      description:
        "For intensive preparation — build fully custom sessions, run mock assessment centres, and track performance with advanced analytics.",
      features: [
        { text: "Everything in Plus" },
        { text: "Custom session builder: 3–10 questions per session", isNew: true },
        { text: "Hybrid question mix — set your own blend of competency, technical, leadership, motivation and situational", isNew: true },
        { text: "Mock assessment centre (case study + interview + presentation)" },
        { text: "Advanced session analytics" },
        { text: "Competency gap tracking across sessions" },
        { text: "Priority coaching queue" },
      ] as PlanFeature[],
      cta: "Get started",
      stripePlanMonthly: "professional_monthly" as StripePlanId,
      stripePlanAnnual: "professional_annual" as StripePlanId,
      highlight: false,
    },
  ];

  /**
   * Paid plan flow:
   * 1. Save the chosen plan ID to sessionStorage so the sign-up/complete
   *    page can pick it up and redirect straight to Stripe checkout.
   * 2. Navigate the user to the sign-up page.
   *
   * This means subscription selection is always part of the sign-up journey
   * rather than a standalone step, and we always capture the account first.
   */
  function handlePaidCta(plan: (typeof plans)[number]) {
    const stripePlanId = annual ? plan.stripePlanAnnual : plan.stripePlanMonthly;
    if (!stripePlanId) return;
    try {
      sessionStorage.setItem("aim_pending_plan", stripePlanId);
    } catch {
      // sessionStorage unavailable — sign-up will just land on /practice
    }
    router.push("/for-candidates/sign-up");
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
            annual && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice;
          const displayPeriod =
            annual && plan.annualPrice ? "/year" : plan.period;
          const annualMonthlyEquiv = annual && plan.annualMonthly ? plan.annualMonthly : null;
          const isPaid = plan.stripePlanMonthly !== null;

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
                  {annualMonthlyEquiv}/month — charged as a single annual payment
                </p>
              )}
              <p className="mt-4 min-h-[60px] text-sm leading-6 text-gray-400">
                {plan.description}
              </p>
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span
                      className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${
                        plan.highlight ? "text-purple-400" : "text-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="flex-1">{f.text}</span>
                    {f.isNew && (
                      <span className="mt-[1px] shrink-0 rounded-full bg-fuchsia-400/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-fuchsia-300">
                        New
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {isPaid ? (
                <button
                  onClick={() => handlePaidCta(plan)}
                  className={`mt-8 flex w-full justify-center rounded-2xl px-5 py-3.5 text-sm font-black transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href="/for-candidates/sign-up"
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
