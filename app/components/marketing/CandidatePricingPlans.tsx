"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export type PricingCurrency = "GBP" | "USD" | "EUR";

type PriceSet = { monthly: string; annual: string; annualMonthly: string; saving: string };

const PLUS: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£19",  annual: "£169",  annualMonthly: "£14.08", saving: "26%" },
  USD: { monthly: "$25",  annual: "$209",  annualMonthly: "$17.42", saving: "30%" },
  EUR: { monthly: "€22",  annual: "€189",  annualMonthly: "€15.75", saving: "28%" },
};

const PROFESSIONAL: Record<PricingCurrency, PriceSet> = {
  GBP: { monthly: "£29",  annual: "£249",  annualMonthly: "£20.75", saving: "28%" },
  USD: { monthly: "$37",  annual: "$299",  annualMonthly: "$24.92", saving: "33%" },
  EUR: { monthly: "€32",  annual: "€279",  annualMonthly: "€23.25", saving: "27%" },
};

type StripePlanId =
  | "plus_monthly"
  | "plus_annual"
  | "professional_monthly"
  | "professional_annual";

// Side-by-side feature comparison (makes the Free → Plus → Professional cliff clear).
// `info` renders a hover/focus tooltip with a plain-English explanation.
const COMPARE: Array<{ feature: string; free: string | boolean; plus: string | boolean; pro: string | boolean; info?: string }> = [
  { feature: "Practice sessions", free: "3 / month", plus: "Unlimited", pro: "Unlimited" },
  { feature: "Typed interviews", free: true, plus: true, pro: true },
  { feature: "Voice interviews", free: false, plus: true, pro: true },
  { feature: "Voice + camera delivery analysis", free: false, plus: true, pro: true },
  { feature: "Structured AI feedback per answer", free: "Written", plus: "Full", pro: "Full" },
  { feature: "Model answers", free: true, plus: true, pro: true },
  { feature: "Progress tracking & history", free: false, plus: true, pro: true },
  { feature: "Custom session builder (3–10 questions)", free: false, plus: false, pro: true },
  {
    feature: "Hybrid question mix",
    free: false, plus: false, pro: true,
    info: "Blend different question types in a single session. For example: 3 competency, 3 technical and 2 leadership questions, matching the exact interview you are preparing for.",
  },
  { feature: "Mock assessment centre", free: "1 free run", plus: "1 free run", pro: "Unlimited" },
  { feature: "CV & Application Studio", free: "2 free", plus: "2 free", pro: "Unlimited" },
  {
    feature: "Advanced analytics & gap tracking",
    free: false, plus: false, pro: true,
    info: "Charts of your scores over time, plus a view of which skills keep scoring lowest across sessions, so you know exactly what to practise next.",
  },
];

/** Small "i" icon that reveals a plain-English explanation on hover or focus. */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-white/25 text-[10px] font-bold leading-none text-gray-400 transition hover:border-purple-300/60 hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-white/10 bg-[#1a1030] px-3.5 py-2.5 text-left text-xs font-normal leading-5 text-gray-200 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function renderCell(v: string | boolean) {
  if (typeof v === "boolean") {
    return v ? (
      <span className="text-emerald-400" aria-label="Included">✓</span>
    ) : (
      <span className="text-gray-400" aria-label="Not included">–</span>
    );
  }
  return <span className="text-gray-200">{v}</span>;
}

type PlanFeature = { text: string; isNew?: boolean };

export function CandidatePricingPlans({ currency = "GBP" }: { currency?: PricingCurrency }) {
  const [annual, setAnnual] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  /** Plan id currently being sent to Stripe (drives the button spinner). */
  const [checkoutPlan, setCheckoutPlan] = useState<StripePlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  // Capture a promotion code from marketing links (…/pricing?promo=CODE) so
  // checkout can pre-apply it after sign-up without the user typing anything.
  useEffect(() => {
    try {
      const promo = new URLSearchParams(window.location.search).get("promo");
      if (promo) sessionStorage.setItem("aim_promo", promo.trim().toUpperCase());
    } catch {
      // sessionStorage unavailable; the user can still type the code at checkout.
    }
  }, []);

  const pro = PLUS[currency];
  const adv = PROFESSIONAL[currency];

  const plans = [
    {
      name: "Free",
      monthlyPrice: "Free",
      annualPrice: null as string | null,
      annualMonthly: null as string | null,
      annualSaving: null as string | null,
      period: null as string | null,
      description: "Always free, with no payment details and no time limit. Three practice sessions every month with AI-tailored questions, scored feedback and a model answer to learn from.",
      features: [
        { text: "Always free, no payment details required" },
        { text: "3 practice sessions every month" },
        { text: "AI-generated tailored interview questions" },
        { text: "Scored feedback and a model answer per question" },
        { text: "1 free mock assessment centre to try" },
        { text: "2 free Career Docs generations to try" },
      ] as PlanFeature[],
      cta: "Click to use for free",
      stripePlanMonthly: null as StripePlanId | null,
      stripePlanAnnual: null as StripePlanId | null,
      highlight: false,
    },
    {
      name: "Plus",
      monthlyPrice: pro.monthly,
      annualPrice: pro.annual,
      annualMonthly: pro.annualMonthly,
      annualSaving: pro.saving,
      period: "/month",
      description:
        "For candidates actively preparing: unlimited practice with full feedback, voice interview and camera analysis.",
      features: [
        { text: "Unlimited interview practice sessions" },
        { text: "All 3 interview modes: typed, voice and voice + camera" },
        { text: "Voice delivery and camera presence analysis" },
        { text: "Full structured feedback per answer" },
        { text: "Model answers per question" },
        { text: "Progress history saved and tracked" },
        { text: "1 free mock assessment centre to try" },
        { text: "2 free Career Docs generations to try" },
      ] as PlanFeature[],
      cta: "Click for 3-day free trial · No payment details required",
      stripePlanMonthly: "plus_monthly" as StripePlanId,
      stripePlanAnnual: "plus_annual" as StripePlanId,
      highlight: false,
    },
    {
      name: "Professional",
      monthlyPrice: adv.monthly,
      annualPrice: adv.annual,
      annualMonthly: adv.annualMonthly,
      annualSaving: adv.saving,
      period: "/month",
      description:
        "For intensive preparation: build fully custom sessions, run mock assessment centres, and track performance with advanced analytics.",
      features: [
        { text: "Everything in Plus" },
        { text: "CV & Application Studio: CV Enhancer, cover letters and personal statements", isNew: true },
        { text: "Custom session builder: 3–10 questions per session", isNew: true },
        { text: "Hybrid question mix: set your own blend of competency, technical, leadership, motivation and situational", isNew: true },
        { text: "Mock assessment centre (case study + interview + presentation)" },
        { text: "Advanced session analytics" },
        { text: "Competency gap tracking across sessions" },
        { text: "Priority coaching queue" },
      ] as PlanFeature[],
      cta: "Get started",
      stripePlanMonthly: "professional_monthly" as StripePlanId,
      stripePlanAnnual: "professional_annual" as StripePlanId,
      highlight: true,
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
  async function handlePaidCta(plan: (typeof plans)[number]) {
    const stripePlanId = annual ? plan.stripePlanAnnual : plan.stripePlanMonthly;
    if (!stripePlanId) return;

    // SIGNED OUT: selection is carried through sign-up into checkout.
    if (!isSignedIn) {
      try {
        sessionStorage.setItem("aim_pending_plan", stripePlanId);
      } catch {
        // sessionStorage unavailable — sign-up will just land on /practice
      }
      router.push("/for-candidates/sign-up");
      return;
    }

    // SIGNED IN: go straight to Stripe. Previously this also routed to
    // /for-candidates/sign-up, but Clerk bounces an already-signed-in user off
    // that page, so they never reached the step that reads the pending plan —
    // the purchase silently died and they were dropped back into the app.
    // An existing paid subscription returns 409 and its message points at the
    // account plan page (changing plan there avoids double-billing). An active
    // no-card trial is NOT a Stripe subscription, so trialling users check out
    // normally and the trial is superseded.
    setCheckoutPlan(stripePlanId);
    setCheckoutError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: stripePlanId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string; code?: string }
        | null;

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError(data?.error ?? "Could not open checkout. Please try again.");
    } catch {
      setCheckoutError("Could not open checkout. Please try again.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${!annual ? "text-white" : "text-gray-400"}`}>
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
        <span className={`text-sm font-semibold ${annual ? "text-white" : "text-gray-400"}`}>
          Annual
        </span>
        {annual && (
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
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
          // Free AND Plus enter via the no-payment sign-up (the trial grants
          // Plus), so their CTA starts the free trial — not a Stripe checkout.
          // Professional is a direct paid subscription.
          const startsFreeTrial = !isPaid || plan.name === "Plus";

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
                <span className="mb-5 inline-flex self-start rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
                  Most popular
                </span>
              )}
              {!plan.highlight && <div className="mb-5 h-7" />}

              <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-4xl font-bold leading-none tracking-tight">
                  {displayPrice}
                </span>
                {displayPeriod && (
                  <span className="mb-1.5 text-sm text-gray-400">{displayPeriod}</span>
                )}
              </div>
              {annualMonthlyEquiv && (
                <p className="mt-1 text-xs text-gray-400">
                  {annualMonthlyEquiv}/month, charged as a single annual payment
                </p>
              )}
              {!annual && plan.annualPrice && (
                <p className="mt-1 text-xs text-gray-400">
                  or{" "}
                  <span className="font-bold text-gray-300">{plan.annualPrice}/year</span>
                  {plan.annualSaving && (
                    <span className="text-emerald-300"> and save {plan.annualSaving}</span>
                  )}
                </p>
              )}
              <p
                className={`mt-4 min-h-[60px] leading-6 ${
                  plan.name === "Free"
                    ? "text-sm text-gray-400"
                    : "text-[15px] font-bold text-white"
                }`}
              >
                {plan.description}
              </p>
              {plan.name === "Professional" && (
                <div className="mt-4 rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-3.5 py-3">
                  <p className="text-[11px] font-bold tracking-wide text-fuchsia-300">
                    CV &amp; Application Studio included
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-300">
                    CV Enhancer with scored feedback, tailored cover letters and
                    personal statements: the tools that get you shortlisted
                    before you ever interview.
                  </p>
                </div>
              )}
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span
                      className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${
                        plan.highlight ? "text-purple-400" : "text-gray-400"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="flex-1">{f.text}</span>
                    {f.isNew && (
                      <span className="mt-[1px] shrink-0 rounded-full bg-fuchsia-400/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-fuchsia-300">
                        New
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {startsFreeTrial ? (
                <Link
                  href="/for-candidates/sign-up"
                  className={`mt-8 flex min-h-[3.75rem] w-full items-center justify-center rounded-2xl px-5 py-3 text-center text-sm font-bold leading-tight transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => void handlePaidCta(plan)}
                  disabled={checkoutPlan !== null}
                  className={`mt-8 flex min-h-[3.75rem] w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl shadow-purple-950/35 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {checkoutPlan ===
                  (annual ? plan.stripePlanAnnual : plan.stripePlanMonthly)
                    ? "Opening checkout…"
                    : plan.cta}
                </button>
              )}
              {checkoutError && !startsFreeTrial && checkoutPlan === null && (
                <p className="mt-3 text-center text-[11px] font-semibold text-amber-300">
                  {checkoutError}
                </p>
              )}
              {isPaid ? (
                <p className="mt-3 text-center text-[11px] font-semibold text-emerald-300/90">
                  7-day money-back guarantee, no questions asked
                </p>
              ) : (
                // Reserve the same vertical space on the Free card (which has no
                // guarantee line) so all three CTA buttons line up on one row.
                <p className="mt-3 text-center text-[11px] font-semibold text-transparent" aria-hidden>
                  &nbsp;
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan comparison matrix */}
      <div className="mx-auto mt-14 max-w-4xl">
        <h3 className="mb-6 text-center text-2xl font-bold tracking-tight">Compare plans</h3>
        {/* On narrow phones the table scrolls sideways but iOS hides the
            scrollbar, so Plus/Professional are invisible without this cue. */}
        <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-purple-200/80 sm:hidden">
          Swipe the table sideways to compare all plans →
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th scope="col" className="px-4 py-3 text-left font-bold text-gray-300">Feature</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-gray-300">Free</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-purple-200">Plus</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-gray-300">Professional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {COMPARE.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 text-left text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {row.feature}
                      {row.info && <InfoTip text={row.info} />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{renderCell(row.free)}</td>
                  <td className="bg-purple-300/[0.04] px-4 py-3 text-center">{renderCell(row.plus)}</td>
                  <td className="px-4 py-3 text-center">{renderCell(row.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-renewal disclosure — required for recurring UK/EU subscriptions */}
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-gray-400">
        Paid plans are recurring subscriptions that renew automatically
        (monthly or annually) at the price shown until you cancel. You can
        cancel any time from your account, and you keep access until the end of the
        period you&rsquo;ve paid for. Every paid plan comes with a 7-day
        money-back guarantee. The 3-day free trial requires no payment details and
        never auto-charges.
      </p>
    </>
  );
}
