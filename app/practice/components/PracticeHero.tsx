"use client";

import Link from "next/link";
import { isProPlanName } from "@/app/lib/planName";

type PracticeHeroProps = {
  setupSummary: string;
  usageSummary: string;
  usageLimitReached: boolean;
  usageMessage: string;
  planName: string;
};

/**
 * The top of the signed-in practice page: one compact card that says what
 * will happen when you press Start, and lets you press it.
 *
 * This used to be a two-column marketing hero — sales headline, stat tiles
 * and a "session preview" panel re-explaining the product — on a page only
 * signed-in users ever see. Everything that carried state (setup summary,
 * plan/usage, the Start action, the assessment-centre cross-link) is kept;
 * everything that was selling is gone. The full setup form lives below at
 * #interview-setup, unchanged.
 */
export function MockAssessmentCentreLink({ planName }: { planName: string }) {
  return (
    <div className="mb-6">
      {/* Assessment centre — direct for subscribers, upsell for everyone else */}
      <Link
        href={isProPlanName(planName) ? "/assessment-centre" : "/mock-assessment-centre"}
        className="mt-4 block"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
          <p className="text-sm font-bold text-white">
            Mock assessment centre
            <span className="ml-2 text-xs font-semibold text-gray-400">
              Case study · Interview · Presentation
            </span>
          </p>
          <span className="text-xs font-bold text-cyan-300">
            {isProPlanName(planName) ? "Included — go →" : "Included in Pro — see it →"}
          </span>
        </div>
      </Link>
    </div>
  );
}

export function PracticeHero({
  setupSummary,
  usageSummary,
  usageLimitReached,
  usageMessage,
  planName,
}: PracticeHeroProps) {
  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          Your next session
        </h1>
        <p
          className={`text-xs font-semibold ${
            usageLimitReached ? "text-amber-200" : "text-gray-400"
          }`}
        >
          {planName} plan · {usageSummary}
          {usageMessage ? ` — ${usageMessage}` : ""}
        </p>
      </div>

      <p className="mt-1.5 max-w-full break-words text-xs leading-5 text-gray-400">
        {setupSummary}
      </p>

      {/* The primary Start lives in the setup panel below, under the choices it
          acts on, and "Add CV / role profile" sits there too. Two Start buttons
          and two profile links on one screen was part of why people were
          getting lost. */}

    </div>
  );
}
