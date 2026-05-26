"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InterviewSummary, ResultItem, SavedSession } from "../../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreTextColor(s: number) {
  if (s >= 8) return "text-emerald-400";
  if (s >= 6) return "text-cyan-300";
  if (s >= 4) return "text-amber-300";
  return "text-rose-400";
}

function scoreBarColor(s: number) {
  if (s >= 8) return "bg-emerald-400";
  if (s >= 6) return "bg-cyan-400";
  if (s >= 4) return "bg-amber-400";
  return "bg-rose-400";
}

function hireSignalStyle(signal: string) {
  if (signal === "Strong")
    return {
      badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      dot: "bg-emerald-400",
    };
  if (signal === "Moderate")
    return {
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      dot: "bg-amber-400",
    };
  return {
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
  };
}

function firstWord(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

// ─── STAR section ───────────────────────────────────────────────────────────

const starColors = {
  cyan: {
    bg: "bg-cyan-400/15",
    border: "border-cyan-400/25",
    letter: "text-cyan-300",
    label: "text-cyan-200",
  },
  purple: {
    bg: "bg-purple-400/15",
    border: "border-purple-400/25",
    letter: "text-purple-300",
    label: "text-purple-200",
  },
  fuchsia: {
    bg: "bg-fuchsia-400/15",
    border: "border-fuchsia-400/25",
    letter: "text-fuchsia-300",
    label: "text-fuchsia-200",
  },
  emerald: {
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/25",
    letter: "text-emerald-300",
    label: "text-emerald-200",
  },
} as const;

function StarSection({
  letter,
  label,
  color,
  text,
}: {
  letter: string;
  label: string;
  color: keyof typeof starColors;
  text: string;
}) {
  const c = starColors[color];
  return (
    <div className={`flex gap-3 rounded-[1rem] border ${c.border} ${c.bg} p-4`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${c.border} text-xs font-black ${c.letter}`}
      >
        {letter}
      </div>
      <div>
        <p className={`mb-1 text-xs font-black uppercase tracking-[0.15em] ${c.label}`}>
          {label}
        </p>
        <p className="text-sm leading-7 text-gray-200">{text}</p>
      </div>
    </div>
  );
}

// ─── Score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(10, Math.max(0, score)) / 10;
  const offset = circumference * (1 - pct);
  const strokeColor =
    score >= 8
      ? "#34d399"
      : score >= 6
        ? "#67e8f9"
        : score >= 4
          ? "#fbbf24"
          : "#f87171";

  return (
    <div className="relative mx-auto inline-flex">
      <svg width="148" height="148" viewBox="0 0 148 148">
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="12"
        />
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 74 74)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-black tracking-tight"
          style={{ color: strokeColor }}
        >
          {score}
        </span>
        <span className="text-xs font-bold text-gray-500">/10</span>
      </div>
    </div>
  );
}

// ─── Category bar ───────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  content: "Content quality",
  clarity: "Clarity",
  relevance: "Relevance",
  structure: "Structure",
  confidence: "Confidence",
  pace: "Pace",
  voice_delivery: "Voice delivery",
  camera_presence: "Camera presence",
};

function CategoryBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const pct = Math.round((score / 10) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">{label}</span>
        <span className={`text-xs font-black ${scoreTextColor(score)}`}>
          {score}/10
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Question card ──────────────────────────────────────────────────────────

function QuestionCard({
  result,
  index,
}: {
  result: ResultItem;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const score = result.feedback.overall_score;

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/25 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-white/[0.04] sm:p-5"
      >
        <span
          className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${scoreTextColor(score)} border ${score >= 8 ? "border-emerald-400/25 bg-emerald-400/10" : score >= 6 ? "border-cyan-400/25 bg-cyan-400/10" : score >= 4 ? "border-amber-400/25 bg-amber-400/10" : "border-rose-400/25 bg-rose-400/10"}`}
        >
          Q{index + 1} · {score}/10
        </span>
        <p className="flex-1 text-sm font-semibold leading-6 text-gray-200">
          {result.question}
        </p>
        <span className="mt-1 shrink-0 text-xs text-gray-500">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/[0.07] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 space-y-4">

          {/* Your answer | Model answer — side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {result.answer.trim() && (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Your answer
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {result.answer}
                </p>
              </div>
            )}
            {result.feedback.improved_answer && (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Model answer
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {result.feedback.improved_answer}
                </p>
              </div>
            )}
          </div>

          {/* Strengths | Improvements — side by side */}
          {(result.feedback.strengths.length > 0 || result.feedback.improvements.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.feedback.strengths.length > 0 && (
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                    Strengths
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.feedback.strengths.map((s) => (
                      <li key={s} className="flex gap-2 text-sm leading-6 text-gray-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.feedback.improvements.length > 0 && (
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
                    Improvements
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.feedback.improvements.map((s) => (
                      <li key={s} className="flex gap-2 text-sm leading-6 text-gray-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type SessionSummaryProps = {
  summaryLoading: boolean;
  summary: InterviewSummary | null;
  savedSessions: SavedSession[];
  onRestart: () => void;
  role: string;
  userName: string;
  results: ResultItem[];
  interviewType: string;
  difficulty: string;
  freePlan?: boolean;
  sessionsUsed?: number;
};

export function SessionSummary({
  summaryLoading,
  summary,
  savedSessions,
  onRestart,
  role,
  userName,
  results,
  interviewType,
  difficulty,
  freePlan = false,
  sessionsUsed,
}: SessionSummaryProps) {
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certCopied, setCertCopied] = useState(false);

  const firstName = firstWord(userName);
  const hireStyle = summary ? hireSignalStyle(summary.hire_signal) : null;

  // Issue certificate once summary loads with score >= 6
  useEffect(() => {
    if (!summary || summary.overall_score < 6 || certLoading || certificateId)
      return;
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
      .then((d) => {
        if (d.id) setCertificateId(d.id);
      })
      .catch(() => {})
      .finally(() => setCertLoading(false));
  }, [summary, role, userName, certLoading, certificateId]);

  function copyCertLink() {
    if (!certificateId) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/certificate/${certificateId}`
    );
    setCertCopied(true);
    setTimeout(() => setCertCopied(false), 2000);
  }

  // Visible category entries
  const categoryEntries = summary?.category_breakdown
    ? (
        Object.entries(summary.category_breakdown) as [string, number][]
      ).filter(([, v]) => v > 0)
    : [];

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
          Interview complete
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          {firstName
            ? `Well done, ${firstName}!`
            : "Well done — interview complete!"}
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          {role && <span className="font-semibold text-white">{role}</span>}
          {role && interviewType && <span className="mx-2 text-gray-600">·</span>}
          {interviewType && <span>{interviewType}</span>}
          {difficulty && (
            <>
              <span className="mx-2 text-gray-600">·</span>
              <span>{difficulty} difficulty</span>
            </>
          )}
          {results.length > 0 && (
            <>
              <span className="mx-2 text-gray-600">·</span>
              <span>{results.length} question{results.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </p>

        {summaryLoading && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <p className="text-sm text-gray-400">
              Generating your personalised report…
            </p>
          </div>
        )}
      </div>

      {summary && (
        <>
          {/* ── Score + Hire signal ──────────────────────────────────────── */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            {/* Score */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl sm:flex-row sm:items-start sm:justify-start">
              <ScoreRing score={summary.overall_score} />
              <div className="text-center sm:text-left">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                  Overall score
                </p>
                <p
                  className={`mt-1 text-2xl font-black ${scoreTextColor(summary.overall_score)}`}
                >
                  {summary.overall_score >= 8
                    ? "Excellent"
                    : summary.overall_score >= 6
                      ? "Good performance"
                      : summary.overall_score >= 4
                        ? "Developing"
                        : "Needs work"}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {summary.overall_score >= 8
                    ? "You are interview-ready for this role."
                    : summary.overall_score >= 6
                      ? "Solid foundation — targeted practice will sharpen your edge."
                      : summary.overall_score >= 4
                        ? "You have the basics — structured practice will accelerate your progress."
                        : "Focus on the improvements below — consistent practice makes a significant difference."}
                </p>
              </div>
            </div>

            {/* Hire signal */}
            <div className="flex flex-col justify-between gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                  Hire signal
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${hireStyle!.dot}`}
                  />
                  <span
                    className={`rounded-full border px-4 py-1.5 text-sm font-black ${hireStyle!.badge}`}
                  >
                    {summary.hire_signal}
                  </span>
                </div>
                {summary.hire_signal_reason && (
                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    {summary.hire_signal_reason}
                  </p>
                )}
                {!summary.hire_signal_reason && (
                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    {summary.final_recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Category breakdown ──────────────────────────────────────── */}
          {categoryEntries.length > 0 && (
            <div className="mb-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-purple-300">
                Performance breakdown
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryEntries.map(([key, value]) => (
                  <CategoryBar
                    key={key}
                    label={categoryLabels[key] ?? key}
                    score={value}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Strongest / Weakest answers ─────────────────────────────── */}
          {(summary.strongest_answer || summary.weakest_answer) && (
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              {summary.strongest_answer && (
                <div className="rounded-[1.7rem] border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                    ★ Strongest answer — Q{summary.strongest_answer.question_number}
                  </p>
                  <p className="mb-3 text-sm font-semibold text-white line-clamp-2">
                    {summary.strongest_answer.question}
                  </p>
                  <p className="mb-3 text-sm leading-6 text-gray-300">
                    {summary.strongest_answer.reason}
                  </p>
                  <span
                    className={`text-xs font-black ${scoreTextColor(summary.strongest_answer.score)}`}
                  >
                    Score: {summary.strongest_answer.score}/10
                  </span>
                </div>
              )}
              {summary.weakest_answer && (
                <div className="rounded-[1.7rem] border border-amber-400/20 bg-amber-400/[0.06] p-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    ↗ Biggest opportunity — Q{summary.weakest_answer.question_number}
                  </p>
                  <p className="mb-3 text-sm font-semibold text-white line-clamp-2">
                    {summary.weakest_answer.question}
                  </p>
                  <p className="mb-3 text-sm leading-6 text-gray-300">
                    {summary.weakest_answer.reason}
                  </p>
                  <span
                    className={`text-xs font-black ${scoreTextColor(summary.weakest_answer.score)}`}
                  >
                    Score: {summary.weakest_answer.score}/10
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── STAR model answer ───────────────────────────────────────── */}
          {summary.star_model_answer && (
            <div className="mb-4 rounded-[1.7rem] border border-cyan-400/20 bg-cyan-400/[0.05] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                STAR model answer
              </p>
              <p className="mb-5 text-sm text-gray-400">
                A strong example answer for your weakest question, structured using the{" "}
                <span className="font-semibold text-cyan-200">
                  Situation → Task → Action → Result
                </span>{" "}
                framework.
              </p>

              <p className="mb-5 text-sm font-semibold leading-6 text-white">
                Q: {summary.star_model_answer.question}
              </p>

              <div className="space-y-4">
                <StarSection
                  letter="S"
                  label="Situation"
                  color="cyan"
                  text={summary.star_model_answer.situation}
                />
                <StarSection
                  letter="T"
                  label="Task"
                  color="purple"
                  text={summary.star_model_answer.task}
                />
                <StarSection
                  letter="A"
                  label="Action"
                  color="fuchsia"
                  text={summary.star_model_answer.action}
                />
                <StarSection
                  letter="R"
                  label="Result"
                  color="emerald"
                  text={summary.star_model_answer.result}
                />
              </div>
            </div>
          )}

          {/* ── Per-question breakdown ──────────────────────────────────── */}
          {results.length > 0 && (
            <div className="mb-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Question-by-question breakdown
              </p>
              <div className="space-y-2">
                {results.map((result, i) => (
                  <QuestionCard key={i} result={result} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Strengths & Improvements ────────────────────────────────── */}
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                Top strengths
              </p>
              <ul className="space-y-3">
                {summary.top_strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm leading-6 text-gray-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                Priority improvements
              </p>
              <ul className="space-y-3">
                {(summary.priority_improvements?.length
                  ? summary.priority_improvements
                  : summary.top_improvements
                ).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm leading-6 text-gray-300">
                    <span className="mt-1 text-amber-400">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── 7-day action plan ───────────────────────────────────────── */}
          {summary.seven_day_action_plan && summary.seven_day_action_plan.length > 0 && (
            <div className="mb-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-purple-300">
                Your 7-day improvement plan
              </p>
              <div className="space-y-3">
                {summary.seven_day_action_plan.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-black text-purple-300">
                        {i + 1}
                      </div>
                      {i < (summary.seven_day_action_plan?.length ?? 0) - 1 && (
                        <div className="mt-1 h-full w-px bg-white/[0.07]" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-black text-purple-200">{item.day} — {item.focus}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-300">{item.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Next steps ──────────────────────────────────────────────── */}
          {summary.next_steps && summary.next_steps.length > 0 && (
            <div className="mb-4 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl sm:p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Recommended next steps
              </p>
              <ol className="space-y-3">
                {summary.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-[11px] font-black text-cyan-300">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-6 text-gray-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Free plan upgrade CTA ───────────────────────────────────── */}
          {freePlan && (
            <div className="mb-4 rounded-[1.7rem] border border-purple-400/25 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-300">
                Unlock your full potential
              </p>
              <h3 className="mt-2 text-lg font-black text-white">
                {sessionsUsed != null && sessionsUsed >= 3
                  ? "You've used all 3 free sessions"
                  : sessionsUsed != null
                  ? `You've used ${sessionsUsed} of 3 free session${sessionsUsed === 1 ? "" : "s"}`
                  : "You're on the free plan"}
              </h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">
                Upgrade to Plus to get unlimited sessions, voice interview mode,
                camera presence scoring, detailed voice delivery analysis, and your
                personalised 7-day improvement plan tracked over time.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-900/35 transition hover:scale-[1.01]"
                >
                  See plans →
                </Link>
                <Link
                  href="/practice"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                >
                  Practice setup
                </Link>
              </div>
            </div>
          )}

          {/* ── Certificate ─────────────────────────────────────────────── */}
          {summary.overall_score >= 6 && (
            <div className="mb-4 rounded-[1.7rem] border border-emerald-400/25 bg-emerald-500/[0.08] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-emerald-300">
                    🏆 Interview Readiness Certificate
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    You scored {summary.overall_score}/10 — you&apos;ve earned a
                    shareable certificate for {role || "this role"}.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
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
                        type="button"
                        onClick={copyCertLink}
                        className="rounded-xl border border-emerald-400/30 px-4 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/10"
                      >
                        {certCopied ? "Copied!" : "Copy link"}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {certLoading ? "Generating…" : "Generating certificate…"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Referral ────────────────────────────────────────────────── */}
          <div className="mb-4 rounded-[1.7rem] border border-purple-400/20 bg-purple-500/[0.07] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-purple-300">
                  Know someone preparing for interviews?
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Share your referral link and help a friend get started.
                </p>
              </div>
              <Link
                href="/refer"
                className="shrink-0 rounded-xl border border-purple-400/30 px-4 py-2 text-center text-xs font-black text-purple-300 hover:bg-purple-500/10"
              >
                Get referral link →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── Action buttons ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
        >
          Start a new session
        </button>
        <Link
          href="/profile"
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.1]"
        >
          Candidate profile
        </Link>
        {savedSessions.length > 1 && (
          <p className="self-center text-xs text-gray-500">
            {savedSessions.length} sessions saved
          </p>
        )}
      </div>
    </section>
  );
}
