"use client";

/**
 * Print-optimised interview report for a saved practice session.
 *
 * Renders the same data as /progress/[sessionId] in a clean, light, paginated
 * layout and auto-opens the browser print dialog ("Save as PDF"). This gives a
 * dependency-free, one-action PDF export the candidate can keep or share with a
 * coach. The route lives under /progress, so Clerk middleware already gates it,
 * and it reuses the auth-scoped GET /api/practice-sessions/[id] endpoint.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StarAnswer } from "@/app/components/StarAnswer";

type CategoryScores = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
};

type Feedback = {
  overall_score?: number;
  category_scores?: CategoryScores;
  pace_score?: number;
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
  metrics?: { estimatedWPM?: number; fillerCount?: number };
} | null;

type VideoAnalysis = {
  overallVideoScore?: number;
  eyeContactScore?: number;
  positionScore?: number;
  bodyLanguageScore?: number;
  engagementScore?: number;
} | null;

type ResultItem = {
  question?: string;
  answer?: string;
  feedback?: Feedback;
  voiceAnalysis?: VoiceAnalysis;
  videoAnalysis?: VideoAnalysis;
};

type CategoryBreakdown = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
  pace?: number;
  voice_delivery?: number;
  camera_presence?: number;
};

type SessionSummary = {
  hire_signal?: string;
  hire_signal_reason?: string;
  category_breakdown?: CategoryBreakdown;
  top_strengths?: string[];
  top_improvements?: string[];
  priority_improvements?: string[];
  final_recommendation?: string;
  next_steps?: string[];
  seven_day_action_plan?: { day?: string; focus?: string; task?: string }[];
};

type PracticeSessionDetail = {
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
  summary?: SessionSummary;
  results?: ResultItem[];
  createdAt: string;
};

export default function SessionPrintPage() {
  const params = useParams();
  const rawId = params?.sessionId;
  const sessionId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] || "" : "";

  const [session, setSession] = useState<PracticeSessionDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/practice-sessions/${sessionId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          setError(data.error || "Could not load this practice session.");
        } else {
          setSession(data.session || null);
        }
      } catch {
        if (!cancelled) setError("Could not load this practice session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Auto-open the print dialog once the report has rendered.
  useEffect(() => {
    if (session && !printedRef.current) {
      printedRef.current = true;
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [session]);

  const results = useMemo(
    () => (Array.isArray(session?.results) ? session!.results! : []),
    [session],
  );
  const summary = session?.summary;
  const isTyped = session?.practiceMode === "typed";

  return (
    <div className="report mx-auto min-h-screen max-w-3xl bg-white px-8 py-10 text-gray-900">
      <style>{`
        :root { color-scheme: light; }
        html, body { background: #ffffff; }
        .report { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          .avoid-break { break-inside: avoid; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print mb-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-400">
          Your interview report is ready. Choose <strong>Save as PDF</strong> in the print dialog.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Save as PDF
          </button>
          <Link
            href={`/progress/${sessionId}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Back to session
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading your session…</p>}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      {session && (
        <>
          <header className="avoid-break border-b border-gray-200 pb-6">
            <p className="text-xs font-bold tracking-wide text-purple-700">
              AI Career Mentor · Interview report
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{session.role}</h1>
            <p className="mt-2 text-sm text-gray-400">
              {session.interviewType} · {session.experienceLevel} · {session.difficulty} difficulty
              · Focus: {session.focusArea}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {formatDate(session.createdAt)} · {session.practiceMode} ·{" "}
              {results.length || session.totalQuestions} questions
            </p>
            <div className="mt-4 flex gap-10">
              <Stat label="Overall score" value={`${session.overallScore}/10`} />
              <Stat label="Hire signal" value={summary?.hire_signal || session.hireSignal} />
            </div>
          </header>

          <Section title="Session summary">
            {summary?.hire_signal_reason && (
              <p className="text-sm leading-6 text-gray-700">{summary.hire_signal_reason}</p>
            )}
            {summary?.final_recommendation && (
              <div className="avoid-break mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Recommendation
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-700">
                  {summary.final_recommendation}
                </p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-6">
              <Bullets title="Top strengths" items={summary?.top_strengths} empty="No strengths saved." />
              <Bullets
                title="Top improvements"
                items={summary?.priority_improvements || summary?.top_improvements}
                empty="No improvements saved."
              />
            </div>
          </Section>

          {summary?.category_breakdown && (
            <Section title="Category performance">
              <div className="space-y-2.5">
                {categoryRows(summary.category_breakdown, session.practiceMode).map((r) => (
                  <Bar key={r.label} label={r.label} value={r.value} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Question-by-question review">
            {results.length === 0 && (
              <p className="text-sm text-gray-400">No question-level results were saved.</p>
            )}
            <div className="space-y-5">
              {results.map((item, i) => {
                const cs = item.feedback?.category_scores;
                return (
                  <div key={i} className="avoid-break rounded-md border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-gray-900">
                        Q{i + 1}. {item.question || "Question not saved."}
                      </p>
                      <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
                        {item.feedback?.overall_score ?? 0}/10
                      </span>
                    </div>

                    <FieldBlock title="Your answer" text={item.answer} />
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                        Model answer (STAR)
                      </p>
                      <StarAnswer
                        star={item.feedback?.improved_answer_star}
                        fallbackText={item.feedback?.improved_answer || "–"}
                        tone="print"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-6">
                      <Bullets title="Strengths" items={item.feedback?.strengths} empty="–" small />
                      <Bullets title="Improvements" items={item.feedback?.improvements} empty="–" small />
                    </div>

                    {cs && (
                      <p className="mt-3 text-xs text-gray-400">
                        Content {score(cs.content)} · Clarity {score(cs.clarity)} · Relevance{" "}
                        {score(cs.relevance)} · Structure {score(cs.structure)} · Confidence{" "}
                        {score(cs.confidence)}
                        {!isTyped && typeof item.feedback?.pace_score === "number"
                          ? ` · Pace ${score(item.feedback.pace_score)}`
                          : ""}
                      </p>
                    )}

                    {item.voiceAnalysis && (
                      <p className="mt-2 text-xs text-gray-400">
                        <span className="font-semibold text-gray-700">
                          Voice {score(item.voiceAnalysis.overallVoiceScore)}
                        </span>{" "}
                        · Pace {score(item.voiceAnalysis.paceScore)} · Fillers{" "}
                        {score(item.voiceAnalysis.fillerScore)} · Confidence{" "}
                        {score(item.voiceAnalysis.confidenceScore)} · Energy{" "}
                        {score(item.voiceAnalysis.energyScore)} · ~
                        {item.voiceAnalysis.metrics?.estimatedWPM ?? 0} WPM
                      </p>
                    )}
                    {item.videoAnalysis && (
                      <p className="mt-1 text-xs text-gray-400">
                        <span className="font-semibold text-gray-700">
                          Camera {score(item.videoAnalysis.overallVideoScore)}
                        </span>{" "}
                        · Eye contact {score(item.videoAnalysis.eyeContactScore)} · Position{" "}
                        {score(item.videoAnalysis.positionScore)} · Body language{" "}
                        {score(item.videoAnalysis.bodyLanguageScore)} · Engagement{" "}
                        {score(item.videoAnalysis.engagementScore)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {summary?.next_steps && summary.next_steps.length > 0 && (
            <Section title="Recommended next steps">
              <Bullets items={summary.next_steps} />
            </Section>
          )}

          {summary?.seven_day_action_plan && summary.seven_day_action_plan.length > 0 && (
            <Section title="7-day action plan">
              <div className="space-y-2">
                {summary.seven_day_action_plan.map((d, i) => (
                  <div key={i} className="avoid-break rounded-md border border-gray-200 p-3">
                    <p className="text-sm font-bold text-gray-900">
                      {d.day || `Day ${i + 1}`} · {d.focus || "Practice"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">
                      {d.task || "Review and refine one answer."}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
            Generated by AI Career Mentor · aicareermentor.co.uk
          </footer>
        </>
      )}
    </div>
  );
}

function score(value?: number): string {
  return typeof value === "number" ? `${value}/10` : "–";
}

function categoryRows(b: CategoryBreakdown, mode?: string) {
  const isTyped = mode === "typed";
  const hasCamera = mode === "voice-camera";
  const rows: Array<{
    label: string;
    value: number;
    key: keyof CategoryBreakdown;
    voiceOnly?: boolean;
    cameraOnly?: boolean;
  }> = [
    { label: "Content", value: b.content ?? 0, key: "content" },
    { label: "Clarity", value: b.clarity ?? 0, key: "clarity" },
    { label: "Relevance", value: b.relevance ?? 0, key: "relevance" },
    { label: "Structure", value: b.structure ?? 0, key: "structure" },
    { label: "Confidence", value: b.confidence ?? 0, key: "confidence" },
    { label: "Pace", value: b.pace ?? 0, key: "pace", voiceOnly: true },
    { label: "Voice delivery", value: b.voice_delivery ?? 0, key: "voice_delivery", voiceOnly: true },
    { label: "Camera presence", value: b.camera_presence ?? 0, key: "camera_presence", cameraOnly: true },
  ];
  return rows.filter((r) => {
    if (r.cameraOnly && !hasCamera) return false;
    if (r.voiceOnly && isTyped) return false;
    if ((r.voiceOnly || r.cameraOnly) && !b[r.key]) return false;
    return true;
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(10, Math.round(value * 10) / 10));
  return (
    <div className="avoid-break">
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-semibold text-gray-800">{label}</span>
        <span className="font-semibold text-gray-400">{v}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-gray-200">
        <div className="h-full rounded bg-purple-600" style={{ width: `${v * 10}%` }} />
      </div>
    </div>
  );
}

function Bullets({
  title,
  items,
  empty = "–",
  small,
}: {
  title?: string;
  items?: string[];
  empty?: string;
  small?: boolean;
}) {
  const list = items && items.length ? items : [empty];
  return (
    <div className="avoid-break">
      {title && (
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
      )}
      <ul
        className={`list-disc space-y-1 pl-4 ${small ? "text-xs" : "text-sm"} leading-6 text-gray-700`}
      >
        {list.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function FieldBlock({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{text || "–"}</p>
    </div>
  );
}
