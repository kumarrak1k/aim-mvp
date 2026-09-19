"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export type PricingCurrency = "GBP" | "USD" | "EUR";

/**
 * One plan, three billing periods (Sep 2026).
 *
 * The old Free and Plus tiers are gone. Splitting the product three ways meant
 * most people practised on a version too thin to be useful and judged the whole
 * thing on it. Everyone now gets the full product: three days free without a
 * card, then Pro.
 */
type BillingPeriod = "monthly" | "quarterly" | "annual";

type PeriodPrice = {
  /** What they are charged, each time. */
  price: string;
  /** The same thing expressed per month, for comparison. */
  perMonth: string;
  /** Percentage saved against paying monthly, or null for the monthly plan. */
  saving: number | null;
  planId: StripePlanId;
  billedAs: string;
};

type StripePlanId = "pro_monthly" | "pro_quarterly" | "pro_annual";

const PRICES: Record<PricingCurrency, Record<BillingPeriod, PeriodPrice>> = {
  GBP: {
    monthly: { price: "£15", perMonth: "£15", saving: null, planId: "pro_monthly", billedAs: "Billed monthly" },
    quarterly: { price: "£38", perMonth: "£12.67", saving: 15, planId: "pro_quarterly", billedAs: "Billed every 3 months" },
    annual: { price: "£120", perMonth: "£10", saving: 33, planId: "pro_annual", billedAs: "Billed once a year" },
  },
  USD: {
    monthly: { price: "$19", perMonth: "$19", saving: null, planId: "pro_monthly", billedAs: "Billed monthly" },
    quarterly: { price: "$48", perMonth: "$16", saving: 15, planId: "pro_quarterly", billedAs: "Billed every 3 months" },
    annual: { price: "$150", perMonth: "$12.50", saving: 34, planId: "pro_annual", billedAs: "Billed once a year" },
  },
  EUR: {
    monthly: { price: "€17", perMonth: "€17", saving: null, planId: "pro_monthly", billedAs: "Billed monthly" },
    quarterly: { price: "€43", perMonth: "€14.33", saving: 15, planId: "pro_quarterly", billedAs: "Billed every 3 months" },
    annual: { price: "€135", perMonth: "€11.25", saving: 34, planId: "pro_annual", billedAs: "Billed once a year" },
  },
};

const PERIOD_LABEL: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Yearly",
};

/** Everything Pro includes. No tier comparison, because there are no tiers. */
const INCLUDED: Array<{ title: string; body: string }> = [
  {
    title: "Unlimited interview practice",
    body: "Questions written for your target role from your CV and the job description, with scored feedback and a model answer after every question.",
  },
  {
    title: "Typed, voice and voice with camera",
    body: "Practise the way you will actually be interviewed, including delivery and presence analysis on your spoken answers.",
  },
  {
    title: "Mock assessment centre",
    body: "Case study, competency interview and presentation in one sitting, scored the way an assessor would score it.",
  },
  {
    title: "CV and Application Studio",
    body: "CV review with scored feedback, tailored cover letters and personal statements, so your application gets you to interview.",
  },
  {
    title: "Progress you can see",
    body: "Every interview saved, scores tracked over time, and the competencies that keep costing you marks.",
  },
  {
    title: "Interviews you can leave and come back to",
    body: "Answers are saved as you go, so a half-finished interview is waiting for you rather than lost.",
  },
];

export function CandidatePricingPlans({
  currency = "GBP",
  compact = false,
}: {
  currency?: PricingCurrency;
  /**
   * The upgrade page: someone whose trial has just ended has used every one of
   * these features, so the list is left out and the card is just price and pay.
   */
  compact?: boolean;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
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

  const selected = PRICES[currency][period];

  /**
   * Signed out, the choice is carried through sign-up into checkout, so the
   * account always exists first. Signed in, it goes straight to Stripe; an
   * existing subscription returns 409 and is pointed at the billing page
   * rather than being charged twice.
   */
  async function startCheckout() {
    if (!isSignedIn) {
      try {
        sessionStorage.setItem("aim_pending_plan", selected.planId);
      } catch {
        // sessionStorage unavailable — sign-up will just land on /practice
      }
      router.push("/for-candidates/sign-up");
      return;
    }

    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selected.planId,
          currency: currency.toLowerCase(),
          ...(compact ? { from: "upgrade" } : {}),
        }),
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
      setCheckoutBusy(false);
    }
  }

  return (
    <>
      {/* Billing period */}
      <div
        role="group"
        aria-label="Billing period"
        className="mx-auto mb-8 flex w-full max-w-md flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 sm:flex-row"
      >
        {(Object.keys(PERIOD_LABEL) as BillingPeriod[]).map((key) => {
          const option = PRICES[currency][key];
          const active = period === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setPeriod(key)}
              className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-on-accent shadow-lg"
                  : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {PERIOD_LABEL[key]}
              {option.saving !== null && (
                <span className={active ? "ml-2 text-on-accent/90" : "ml-2 text-emerald-300"}>
                  save {option.saving}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-3xl rounded-[2rem] border border-purple-300/30 bg-purple-300/[0.08] p-7 shadow-2xl shadow-purple-950/20 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pro</h2>
            <p className="mt-2 max-w-md text-[15px] leading-7 text-gray-300">
              Everything we make, with nothing held back for a higher tier.
            </p>
          </div>

          <div className="sm:text-right">
            <div className="flex items-end gap-1.5 sm:justify-end">
              <span className="text-5xl font-bold leading-none tracking-tight">
                {selected.price}
              </span>
              {period !== "monthly" && (
                <span className="mb-1.5 text-sm text-gray-400">
                  {period === "annual" ? "/year" : "/quarter"}
                </span>
              )}
              {period === "monthly" && <span className="mb-1.5 text-sm text-gray-400">/month</span>}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {selected.billedAs}
              {selected.saving !== null && (
                <span className="text-emerald-300"> · {selected.perMonth} a month</span>
              )}
            </p>
          </div>
        </div>

        {!compact && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="mt-[3px] h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden>
                ✓
              </span>
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="mt-0.5 text-[13px] leading-6 text-gray-300">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className={`${compact ? "mt-6" : "mt-8"} flex flex-col gap-3`}>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={checkoutBusy}
            className="min-h-[48px] w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-on-accent shadow-xl shadow-purple-900/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutBusy
              ? "Opening checkout…"
              : isSignedIn
                ? `Subscribe ${selected.price} ${period === "monthly" ? "a month" : period === "quarterly" ? "a quarter" : "a year"}`
                : "Start your free 3-day trial"}
          </button>

          {!isSignedIn && (
            <p className="text-center text-xs leading-6 text-gray-400">
              Three days free, no payment details. It ends on its own: nothing is
              charged unless you choose to subscribe.
            </p>
          )}

          {checkoutError && (
            <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              {checkoutError}{" "}
              <Link href="/account/plan" className="font-bold underline">
                Go to your plan
              </Link>
            </p>
          )}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-gray-400">
        Cancel any time from your account. Prices include VAT where it applies,
        and you can switch billing period whenever you like.
      </p>
    </>
  );
}
