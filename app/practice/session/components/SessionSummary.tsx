"use client";

import Link from "next/link";
import type { InterviewSummary, SavedSession } from "../../types";
import { FeedbackList } from "./FeedbackWorkspace";

type SessionSummaryProps = {
  summaryLoading: boolean;
  summary: InterviewSummary | null;
  savedSessions: SavedSession[];
  onRestart: () => void;
};

export function SessionSummary({
  summaryLoading,
  summary,
  savedSessions,
  onRestart,
}: SessionSummaryProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
          Interview complete
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
          Final readiness summary
        </h1>

        {summaryLoading && (
          <p className="mt-6 text-base leading-8 text-gray-300">
            Preparing your final interview report...
          </p>
        )}

        {summary && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
              <p className="text-sm text-gray-400">Overall score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-7xl font-black tracking-[-0.08em]">
                  {summary.overall_score}
                </span>
                <span className="mb-3 text-lg font-black text-gray-500">/10</span>
              </div>
              <p className="mt-4 rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-sm font-black text-purple-100">
                Hire signal: {summary.hire_signal}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Recommendation
              </p>
              <p className="text-base leading-8 text-gray-300">
                {summary.final_recommendation}
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeedbackList title="Top strengths" items={summary.top_strengths} />
            <FeedbackList
              title="Top improvements"
              items={summary.top_improvements}
            />
          </div>
        )}

        {savedSessions.length > 0 && (
          <p className="mt-6 text-sm text-gray-500">
            Saved sessions: {savedSessions.length}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            Start a new setup
          </button>
          <Link
            href="/profile"
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.1]"
          >
            Candidate Profile
          </Link>
        </div>
      </div>
    </section>
  );
}