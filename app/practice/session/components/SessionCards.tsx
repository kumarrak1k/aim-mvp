"use client";

import Link from "next/link";

/**
 * Shown briefly to assessment candidates after their final answer while we
 * generate the summary, save the session, and redirect to the completion
 * page. Replaces the SessionSummary screen which would expose scores.
 */
export function AssessmentSubmittingCard() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-emerald-300/20 bg-emerald-300/[0.06] p-8 text-center shadow-2xl shadow-emerald-950/15 backdrop-blur-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-3xl font-bold text-[#0b1a17] shadow-xl shadow-emerald-900/40">
          ✓
        </div>
        <p className="text-[12px] font-bold tracking-wide text-emerald-200">
          Submitting your assessment
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Sending your answers to the hiring team...
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-300">
          Hold on while we save your full set of answers. You&rsquo;ll be taken
          to a confirmation screen in a moment.
        </p>
        <div className="mx-auto mt-7 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
        </div>
      </div>
    </section>
  );
}

export function LoadingSessionCard({ message }: { message: string }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-purple-400/50 to-cyan-300/35" />
        <p className="text-sm font-bold tracking-wide text-cyan-300">
          Practice session
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {message}
        </h1>
      </div>
    </section>
  );
}

export function MissingSessionCard() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <p className="text-sm font-bold tracking-wide text-amber-300">
          Setup required
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Start from the practice setup page.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-300">
          Your interview workspace needs the role, interview type and practice
          mode selected on the setup page.
        </p>
        <Link href="/practice">
          <button className="mt-7 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-4 text-sm font-bold text-on-accent shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
            Return to setup
          </button>
        </Link>
      </div>
    </section>
  );
}