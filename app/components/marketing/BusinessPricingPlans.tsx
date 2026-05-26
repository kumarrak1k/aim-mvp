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

export function BusinessPricingPlans({ currency = "GBP" }: { currency?: PricingCurrency }) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const router = useRouter();
  const team = TEAM[currency];
  const biz = BUSINESS[currency];

  async function handleCheckout(planKey: "team" | "business") {
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/corporate-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billing: annual ? "annual" : "monthly" }),
      });

      if (res.status === 401) {
        // Not signed in — send to business sign-up
        router.push("/for-business/sign-up");
        return;
      }

      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
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
        "For small hiring teams running structured assessments — up to 3 recruiters, 100 candidate invites per month.",
      features: [
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
              ? "border-fuchsia-400/40 bg-fuchsia-500/30"
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
                  {plan.annualMonthly}/month — charged as a single annual payment
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
                        plan.highlight ? "text-fuchsia-400" : "text-gray-500"
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
                      ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-fuchsia-950/35 hover:scale-[1.02]"
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
                      ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-fuchsia-950/35 hover:scale-[1.02]"
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
