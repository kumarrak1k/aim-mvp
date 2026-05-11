"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { PLAN_CONFIG } from "@/app/lib/corporatePlan";

export default function CompanyPlanPage() {
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function choosePlan(planId: "team" | "business") {
    setSelecting(planId);
    setError("");
    try {
      const res = await fetch("/api/company/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to start trial."); return; }
      router.push("/company/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSelecting(null);
    }
  }

  const plans = [
    {
      ...PLAN_CONFIG.team,
      highlight: false,
      features: [
        `${PLAN_CONFIG.team.seats} recruiter seats`,
        `${PLAN_CONFIG.team.invitesPerMonth} candidate invites / month`,
        "Unlimited assessment templates",
        "Full results dashboard",
        "Email invite branding",
        "UK GDPR-ready",
      ],
    },
    {
      ...PLAN_CONFIG.business,
      highlight: true,
      features: [
        `${PLAN_CONFIG.business.seats} recruiter seats`,
        `${PLAN_CONFIG.business.invitesPerMonth} candidate invites / month`,
        "Unlimited templates",
        "Advanced result analytics",
        "Custom branding (logo + colour)",
        "Priority email support",
      ],
    },
  ] as const;

  return (
    <CorporateAppShell currentPath="/company/plan">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-300">
            Choose your plan
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Start your free trial
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            14 days free — no credit card required. Full access to all features
            on your chosen plan. Cancel or change at any time.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[2rem] border p-8 shadow-2xl ${
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

              <h2 className="text-2xl font-black tracking-[-0.03em]">{plan.name}</h2>

              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-5xl font-black leading-none tracking-[-0.07em]">
                  £{plan.priceGBP}
                </span>
                <span className="mb-1.5 text-sm text-gray-500">/month after trial</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span
                      className={`mt-[3px] shrink-0 text-[13px] ${
                        plan.highlight ? "text-fuchsia-400" : "text-gray-500"
                      }`}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choosePlan(plan.id)}
                disabled={selecting !== null}
                className={`mt-8 w-full rounded-2xl px-5 py-4 text-sm font-black transition disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-xl shadow-fuchsia-950/35 hover:scale-[1.02]"
                    : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                }`}
              >
                {selecting === plan.id
                  ? "Starting trial…"
                  : `Start ${plan.trialDays}-day free trial`}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-300">{error}</p>
        )}

        {/* Enterprise */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm font-black text-white">Enterprise</p>
          <p className="mt-1 text-sm text-gray-400">
            Unlimited seats, SSO, DPA, dedicated CSM and custom pricing.
          </p>
          <Link
            href="mailto:hello@aicareermentor.co.uk?subject=Enterprise enquiry"
            className="mt-3 inline-block text-sm font-black text-fuchsia-300 hover:text-fuchsia-200"
          >
            Talk to our team →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Already have a plan?{" "}
          <Link href="/company/dashboard" className="font-bold text-fuchsia-300 hover:text-fuchsia-200">
            Go to dashboard →
          </Link>
        </p>
      </section>
    </CorporateAppShell>
  );
}
