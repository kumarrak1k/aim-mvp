"use client";

import Link from "next/link";
import { isProPlanName } from "@/app/lib/planName";

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
