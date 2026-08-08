"use client";

import Link from "next/link";

type PracticeHeroProps = {
  totalQuestions: number;
  canStartInterview: boolean;
  questionLoading: boolean;
  setupSummary: string;
  usageSummary: string;
  usageLimitReached: boolean;
  usageMessage: string;
  planName: string;
  onStartInterview: () => void;
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
export function PracticeHero({
  totalQuestions,
  canStartInterview,
  questionLoading,
  setupSummary,
  usageSummary,
  usageLimitReached,
  usageMessage,
  planName,
  onStartInterview,
}: PracticeHeroProps) {
  const startDisabled = !canStartInterview || questionLoading;

  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Your next session
      </h1>

      {/* What Start will actually run, in one line */}
      <p className="mt-2 max-w-full break-words text-sm leading-6 text-gray-300">
        {setupSummary}
      </p>

      {/* Plan / usage state — the one status that changes what you can do */}
      {usageLimitReached && planName === "Free" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.1rem] border border-purple-300/20 bg-purple-300/[0.08] px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-gray-200">
            Free plan · this month&apos;s sessions used. {usageSummary}
          </p>
          <Link
            href="/pricing"
            className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            Upgrade to Plus →
          </Link>
        </div>
      ) : (
        <p
          className={`mt-3 text-xs font-semibold ${
            usageLimitReached ? "text-amber-200" : "text-gray-400"
          }`}
        >
          {planName} plan · {usageSummary}
          {usageMessage ? ` — ${usageMessage}` : ""}
        </p>
      )}

      {/* Actions: one primary, two quiet */}
      <div className="mt-5 grid w-full gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={onStartInterview}
          disabled={startDisabled}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {questionLoading
            ? "Starting..."
            : `Start ${totalQuestions}-question interview`}
        </button>
        <a
          href="#interview-setup"
          className="w-full text-center text-sm font-bold text-cyan-200 transition hover:text-cyan-100 sm:w-auto"
        >
          Adjust setup
        </a>
        <Link
          href="/profile"
          className="w-full text-center text-sm font-bold text-purple-200 transition hover:text-purple-100 sm:w-auto"
        >
          Add CV / role profile
        </Link>
      </div>

      {!canStartInterview && !usageLimitReached && (
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Add or load a target role first, then this button will start the
          interview instantly.
        </p>
      )}

      {/* Assessment centre — direct for Professional users, upsell for others */}
      <Link
        href={planName === "Professional" ? "/assessment-centre" : "/mock-assessment-centre"}
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
            {planName === "Professional" ? "Included — go →" : "Professional — see it →"}
          </span>
        </div>
      </Link>
    </div>
  );
}
