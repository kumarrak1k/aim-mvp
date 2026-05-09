"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InterviewSummary, SavedSession } from "../../types";
import { FeedbackList } from "./FeedbackWorkspace";

type SessionSummaryProps = {
  summaryLoading: boolean;
  summary: InterviewSummary | null;
  savedSessions: SavedSession[];
  onRestart: () => void;
  role: string;
  userName: string;
};

export function SessionSummary({
  summaryLoading,
  summary,
  savedSessions,
  onRestart,
  role,
  userName,
}: SessionSummaryProps) {
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certCopied, setCertCopied] = useState(false);

  // Issue certificate once summary loads with score >= 6
  useEffect(() => {
    if (!summary || summary.overall_score < 6 || certLoading || certificateId) return;
    setCertLoading(true);
    fetch("/api/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName || "Candidate",
        role,
        score: summary.overall_score,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.id) setCertificateId(d.id); })
      .catch(() => {})
      .finally(() => setCertLoading(false));
  }, [summary, role, userName, certLoading, certificateId]);

  function copyCertLink() {
    if (!certificateId) return;
    navigator.clipboard.writeText(`${window.location.origin}/certificate/${certificateId}`);
    setCertCopied(true);
    setTimeout(() => setCertCopied(false), 2000);
  }

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

        {/* Certificate banner — shown when score >= 6 */}
        {summary && summary.overall_score >= 6 && (
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-emerald-300">
                  🏆 Interview Readiness Certificate
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  You scored {summary.overall_score}/10 — you&apos;ve earned a shareable certificate.
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {certificateId ? (
                  <>
                    <Link
                      href={`/certificate/${certificateId}`}
                      target="_blank"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500"
                    >
                      View certificate
                    </Link>
                    <button
                      onClick={copyCertLink}
                      className="rounded-xl border border-emerald-400/30 px-4 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/10"
                    >
                      {certCopied ? "Copied!" : "Copy link"}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">
                    {certLoading ? "Generating..." : "Generating certificate..."}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Referral CTA */}
        {summary && (
          <div className="mt-4 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-purple-300">Know someone preparing for interviews?</p>
                <p className="mt-1 text-xs text-gray-400">
                  Share your referral link and help a friend get started.
                </p>
              </div>
              <Link
                href="/refer"
                className="flex-shrink-0 rounded-xl border border-purple-400/30 px-4 py-2 text-center text-xs font-black text-purple-300 hover:bg-purple-500/10"
              >
                Get your referral link →
              </Link>
            </div>
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
