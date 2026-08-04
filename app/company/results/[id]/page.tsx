"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { StarAnswer } from "@/app/components/StarAnswer";

type Feedback = {
  overall_score?: number;
  category_scores?: Record<string, number>;
  pace_score?: number;
  section_feedback?: Record<
    string,
    { score?: number; feedback?: string; improvement?: string }
  >;
  strengths?: string[];
  improvements?: string[];
  improved_answer?: string;
  improved_answer_star?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  } | null;
};

type VoiceAnalysis = {
  overallVoiceScore?: number;
  paceScore?: number;
  fillerScore?: number;
  confidenceScore?: number;
  energyScore?: number;
  metrics?: {
    estimatedWPM?: number;
    fillerCount?: number;
    longPauseCount?: number;
    wordCount?: number;
  };
  feedback?: { strengths?: string[]; improvements?: string[] };
};

type VideoAnalysis = {
  overallVideoScore?: number;
  eyeContactScore?: number;
  positionScore?: number;
  bodyLanguageScore?: number;
  expressionScore?: number;
  engagementScore?: number;
  feedback?: { strengths?: string[]; improvements?: string[] };
};

type ResultItem = {
  question: string;
  answer: string;
  feedback: Feedback | null;
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
};

type SessionSummary = {
  overall_score?: number;
  readiness_score?: number;
  hire_signal?: string;
  category_breakdown?: Record<string, number>;
  top_strengths?: string[];
  priority_improvements?: string[];
  top_improvements?: string[];
  final_recommendation?: string;
  next_steps?: string[];
};

type DetailData = {
  assignment: {
    id: string;
    candidateEmail: string;
    status: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    expiresAt: string;
    emailSent: boolean;
    emailSentAt: string | null;
    emailSendCount: number;
    emailError: string | null;
    template: {
      id: string;
      name: string;
      role: string;
      description: string | null;
      experienceLevel: string;
      interviewType: string;
      difficulty: string;
      focusArea: string;
      questionCount: number;
      customInstructions: string | null;
      competencyFramework: string | null;
    };
  };
  session: {
    id: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    difficulty: string;
    focusArea: string;
    practiceMode: string;
    totalQuestions: number;
    overallScore: number;
    hireSignal: string;
    summary: SessionSummary | null;
    results: ResultItem[];
    completedAt: string;
  } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  clarity: "Clarity",
  relevance: "Relevance",
  structure: "Structure",
  confidence: "Confidence",
  pace: "Pace",
  voice_delivery: "Voice",
  camera_presence: "Camera",
};

export default function CandidateResultDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/company/results/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load.");
          return;
        }
        setData(json);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/results">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  if (error || !data) {
    return (
      <CorporateAppShell currentPath="/company/results">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-red-300">{error || "Not found."}</p>
          <Link
            href="/company/results"
            className="mt-6 inline-block rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.10]"
          >
            ← Back to results
          </Link>
        </div>
      </CorporateAppShell>
    );
  }

  const { assignment, session } = data;
  const summary = session?.summary || null;
  const results = session?.results || [];

  return (
    <CorporateAppShell currentPath="/company/results">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/company/results"
            className="text-sm font-bold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            ← Back to all results
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wide text-fuchsia-300">
                Candidate
              </p>
              <h1 className="mt-1 break-all text-2xl font-bold tracking-tight sm:text-3xl">
                {assignment.candidateEmail}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {assignment.template.name} · {assignment.template.role} ·{" "}
                {assignment.template.experienceLevel}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Pill label="Type" value={assignment.template.interviewType} />
                <Pill label="Difficulty" value={assignment.template.difficulty} />
                <Pill label="Focus" value={assignment.template.focusArea} />
                <Pill
                  label="Questions"
                  value={String(assignment.template.questionCount)}
                />
                {session && (
                  <Pill label="Mode" value={session.practiceMode} />
                )}
              </div>
            </div>

            {/* Headline scores */}
            {session ? (
              <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
                <BigStat
                  label="Overall score"
                  value={`${session.overallScore}/10`}
                  tone={
                    session.overallScore >= 8
                      ? "good"
                      : session.overallScore >= 6
                        ? "neutral"
                        : "weak"
                  }
                />
                <BigStat label="Hire signal" value={session.hireSignal} tone="info" />
                {summary?.readiness_score !== undefined && (
                  <BigStat
                    label="Readiness"
                    value={`${summary.readiness_score}/10`}
                    tone="info"
                  />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-center">
                <p className="text-xs font-bold tracking-wide text-amber-200">
                  Awaiting
                </p>
                <p className="mt-2 text-sm text-amber-100">
                  Candidate has not completed the assessment yet.
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 text-xs sm:grid-cols-3">
            <TimelineItem
              label="Invited"
              value={new Date(assignment.createdAt).toLocaleString("en-GB")}
            />
            <TimelineItem
              label="Email"
              value={
                assignment.emailSent && assignment.emailSentAt
                  ? `Sent ${new Date(assignment.emailSentAt).toLocaleString("en-GB")}`
                  : assignment.emailError
                    ? `Failed: ${assignment.emailError.slice(0, 80)}`
                    : "Not sent"
              }
            />
            <TimelineItem
              label="Completed"
              value={
                assignment.completedAt
                  ? new Date(assignment.completedAt).toLocaleString("en-GB")
                  : "Not yet"
              }
            />
          </div>
        </div>

        {!session ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-gray-400">
              No results to show yet, as the candidate has not completed this
              assessment.
            </p>
          </div>
        ) : (
          <>
            {/* Summary card */}
            {summary && (
              <SummaryCard summary={summary} />
            )}

            {/* Per-question breakdown */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold tracking-tight">
                Per-question breakdown
              </h2>
              <div className="space-y-5">
                {results.map((item, index) => (
                  <QuestionCard
                    key={index}
                    index={index}
                    item={item}
                    totalQuestions={results.length}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </CorporateAppShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-semibold text-gray-300">
      <span className="text-gray-500">{label}:</span> {value}
    </span>
  );
}

function BigStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "weak" | "info";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
      : tone === "weak"
        ? "border-red-300/30 bg-red-300/10 text-red-200"
        : tone === "neutral"
          ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
          : "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";

  return (
    <div className={`rounded-2xl border px-5 py-3 text-center ${toneClass}`}>
      <p className="text-[10px] font-bold tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <p className="text-[10px] font-bold tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-gray-200">{value}</p>
    </div>
  );
}

function SummaryCard({ summary }: { summary: SessionSummary }) {
  const breakdown = summary.category_breakdown || {};
  const orderedKeys = [
    "content",
    "clarity",
    "relevance",
    "structure",
    "confidence",
    "pace",
    "voice_delivery",
    "camera_presence",
  ].filter((k) => k in breakdown);

  return (
    <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10 sm:p-7">
      <p className="text-[11px] font-bold tracking-wide text-fuchsia-300">
        AI overall summary
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
        Recruiter recommendation
      </h2>

      {summary.final_recommendation && (
        <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm leading-7 text-gray-200">
          {summary.final_recommendation}
        </p>
      )}

      {orderedKeys.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold tracking-wide text-gray-400">
            Category averages
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {orderedKeys.map((key) => {
              const score = breakdown[key];
              return <CategoryBar key={key} label={CATEGORY_LABELS[key] || key} score={score} />;
            })}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(summary.top_strengths || []).length > 0 && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
            <p className="text-xs font-bold tracking-wide text-emerald-300">
              Top strengths
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-200">
              {(summary.top_strengths || []).map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-400">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {((summary.priority_improvements || summary.top_improvements) ?? []).length >
          0 && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
            <p className="text-xs font-bold tracking-wide text-amber-300">
              Priority improvements
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-200">
              {(
                summary.priority_improvements ||
                summary.top_improvements ||
                []
              ).map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const safe = Math.max(0, Math.min(10, score));
  const width = (safe / 10) * 100;
  const color =
    safe >= 8
      ? "from-emerald-400 to-cyan-400"
      : safe >= 6
        ? "from-cyan-400 to-blue-400"
        : safe >= 4
          ? "from-amber-400 to-orange-400"
          : "from-red-400 to-rose-400";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-xs font-bold text-gray-300">
          {Math.round(safe * 10) / 10}/10
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  item,
  totalQuestions,
}: {
  index: number;
  item: ResultItem;
  totalQuestions: number;
}) {
  const fb = item.feedback;
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] shadow-lg shadow-black/10">
      <div className="border-b border-white/[0.06] bg-black/20 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wide text-cyan-300">
              Question {index + 1} of {totalQuestions}
            </p>
            <p className="mt-2 text-base font-semibold leading-6 text-white sm:text-lg">
              {item.question}
            </p>
          </div>
          {fb?.overall_score !== undefined && (
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
              <p className="text-[10px] font-bold tracking-wide text-gray-400">
                Score
              </p>
              <p
                className={`text-2xl font-bold ${
                  fb.overall_score >= 8
                    ? "text-emerald-300"
                    : fb.overall_score >= 6
                      ? "text-cyan-300"
                      : fb.overall_score >= 4
                        ? "text-amber-300"
                        : "text-red-300"
                }`}
              >
                {fb.overall_score}
                <span className="text-xs text-gray-500">/10</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2">
        {/* Candidate's answer */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-wide text-purple-300">
            Candidate&rsquo;s answer
          </p>
          <p className="rounded-xl border border-white/[0.06] bg-black/30 p-4 text-sm leading-7 text-gray-200 whitespace-pre-wrap">
            {item.answer || <span className="italic text-gray-500">No answer recorded.</span>}
          </p>
        </div>

        {/* AI feedback */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-wide text-fuchsia-300">
            AI feedback
          </p>

          {fb?.category_scores && Object.keys(fb.category_scores).length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(fb.category_scores).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2"
                >
                  <p className="text-[10px] font-bold tracking-wide text-gray-500">
                    {CATEGORY_LABELS[k] || k}
                  </p>
                  <p className="text-sm font-bold text-white">{v}/10</p>
                </div>
              ))}
            </div>
          )}

          {fb?.strengths && fb.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold tracking-wide text-emerald-300">
                Strengths
              </p>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {fb.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-400">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fb?.improvements && fb.improvements.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold tracking-wide text-amber-300">
                Improvements
              </p>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {fb.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-400">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fb?.improved_answer && (
            <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <summary className="cursor-pointer text-xs font-bold text-cyan-300">
                Show AI model answer
              </summary>
              <div className="mt-3">
                <StarAnswer
                  star={fb.improved_answer_star}
                  fallbackText={fb.improved_answer}
                />
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Voice/video footer */}
      {(item.voiceAnalysis || item.videoAnalysis) && (
        <div className="grid gap-3 border-t border-white/[0.06] bg-black/15 px-5 py-4 sm:grid-cols-2 sm:px-7">
          {item.voiceAnalysis && (
            <DeliveryStrip
              title="Voice delivery"
              entries={[
                { label: "Voice score", value: item.voiceAnalysis.overallVoiceScore },
                { label: "Pace", value: item.voiceAnalysis.paceScore },
                { label: "Filler", value: item.voiceAnalysis.fillerScore },
                { label: "Confidence", value: item.voiceAnalysis.confidenceScore },
                { label: "WPM", value: item.voiceAnalysis.metrics?.estimatedWPM },
                { label: "Fillers", value: item.voiceAnalysis.metrics?.fillerCount },
              ]}
            />
          )}
          {item.videoAnalysis && (
            <DeliveryStrip
              title="Camera presence"
              entries={[
                { label: "Video score", value: item.videoAnalysis.overallVideoScore },
                { label: "Eye contact", value: item.videoAnalysis.eyeContactScore },
                { label: "Position", value: item.videoAnalysis.positionScore },
                { label: "Body lang.", value: item.videoAnalysis.bodyLanguageScore },
                { label: "Expression", value: item.videoAnalysis.expressionScore },
                { label: "Engagement", value: item.videoAnalysis.engagementScore },
              ]}
            />
          )}
        </div>
      )}
    </article>
  );
}

function DeliveryStrip({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ label: string; value: number | undefined }>;
}) {
  const present = entries.filter(
    (e) => typeof e.value === "number" && Number.isFinite(e.value)
  );
  if (present.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold tracking-wide text-gray-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {present.map((e) => (
          <span
            key={e.label}
            className="rounded-full border border-white/[0.07] bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-gray-300"
          >
            <span className="text-gray-500">{e.label}:</span>{" "}
            <span className="text-white">{e.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
