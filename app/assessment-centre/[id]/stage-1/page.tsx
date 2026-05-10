"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { StageProgress } from "@/app/assessment-centre/components/StageProgress";

type Exhibit = { title: string; content: string };
type Scenario = {
  company: string;
  industry: string;
  overview: string;
  challenge: string;
  exhibits: Exhibit[];
  task: string;
  question: string;
  guidance: string[];
};

type FeedbackScores = {
  structure: number;
  analysis: number;
  recommendations: number;
  commercialAwareness: number;
  communication: number;
};

type Feedback = {
  scores: FeedbackScores;
  overall: number;
  commentary: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
};

type Session = {
  id: string;
  status: string;
  currentStage: number;
  role: string;
  sector: string;
  experienceLevel: string;
  selectedStages: string[];
  caseStudyScenario: Scenario;
  caseStudyFeedback?: Feedback;
};

const TOTAL_TIME = 12 * 60; // 720 seconds

/** Safely convert any AI-returned value to a renderable string */
function safeStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const colour =
    score >= 7 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="w-44 text-xs text-gray-400 shrink-0">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-white/[0.08]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${colour} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-black text-white">{score}</span>
    </div>
  );
}

export default function Stage1Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState("");
  const [response, setResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMs = useRef<number>(0);
  const autoSubmittedRef = useRef(false);

  const wordCount = response.trim() === "" ? 0 : response.trim().split(/\s+/).length;

  useEffect(() => {
    fetch(`/api/assessment-centre/${id}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        // Guard against API error responses (auth errors, 404s, etc.)
        const d = data as Record<string, unknown>;
        if (!d.id || typeof d.status !== "string") {
          setLoadError("Session not found or access denied. Please start a new session.");
          return;
        }
        const session = data as Session;
        if (session.status === "stage2" || session.currentStage > 1) {
          router.replace(`/assessment-centre/${id}/stage-2`);
          return;
        }
        if (session.status === "stage3" || session.currentStage > 2) {
          router.replace(`/assessment-centre/${id}/stage-3`);
          return;
        }
        if (session.status === "complete") {
          router.replace(`/assessment-centre/${id}/report`);
          return;
        }
        // Guard: stage-1 requires a case study scenario
        if (!session.caseStudyScenario) {
          setLoadError("Your case study failed to generate. Please start a new session.");
          return;
        }
        setSession(session);
      })
      .catch(() => setLoadError("Failed to load your session. Please refresh."));
  }, [id, router]);

  const startTimer = () => {
    if (timerStarted) return;
    setTimerStarted(true);
    startMs.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (timerExpired && !autoSubmittedRef.current && response.trim().split(/\s+/).length >= 50) {
      autoSubmittedRef.current = true;
      void handleSubmit();
    }
  }, [timerExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleTextChange = (val: string) => {
    setResponse(val);
    if (!timerStarted) startTimer();
  };

  async function handleSubmit() {
    if (submitting || feedback) return;
    const wc = response.trim().split(/\s+/).length;
    if (wc < 50) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = timerStarted ? Date.now() - startMs.current : 0;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/assessment-centre/${id}/submit-case-study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, timeMs: elapsed }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setFeedback(data.feedback as Feedback);
    } catch {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const timerColour =
    timeRemaining > 3 * 60
      ? "text-emerald-400"
      : timeRemaining > 60
      ? "text-amber-400"
      : "text-red-400";

  const timerPulse = timeRemaining <= 60 && !timerExpired;

  if (loadError) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-red-400">{loadError}</p>
        </div>
      </CandidateAppShell>
    );
  }

  if (!session) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="h-8 w-8 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Loading your case study…</p>
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  const scenario = session.caseStudyScenario;

  // Should never be null after the useEffect guard, but protect the render
  if (!scenario) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-red-400 text-sm">Your case study failed to load.</p>
          <a href="/assessment-centre/setup" className="text-cyan-400 text-sm underline hover:text-cyan-300">
            Start a new assessment centre session
          </a>
        </div>
      </CandidateAppShell>
    );
  }

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StageProgress currentStage={1} selectedStages={session.selectedStages} />

        <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
          {/* Left: Scenario */}
          <div className="space-y-5">
            {/* Company header */}
            <div className="rounded-[1.75rem] border border-purple-500/[0.18] bg-purple-500/[0.05] p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-300/90">
                    Stage 1 · Case Study Analysis
                  </p>
                  <h1 className="mt-1.5 text-2xl font-black tracking-[-0.04em] text-white">
                    {safeStr(scenario.company)}
                  </h1>
                </div>
                <span className="shrink-0 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1.5 text-xs font-black text-purple-300">
                  {safeStr(scenario.industry)}
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                Background
              </h2>
              <p className="text-sm leading-7 text-gray-300">{safeStr(scenario.overview)}</p>
            </div>

            {/* Challenge */}
            <div className="rounded-[1.75rem] border border-amber-500/[0.18] bg-amber-500/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-400/90">
                Business Challenge
              </h2>
              <p className="text-sm leading-7 text-amber-100/80">{safeStr(scenario.challenge)}</p>
            </div>

            {/* Exhibits — guard against non-array and non-string content */}
            {Array.isArray(scenario.exhibits) && scenario.exhibits.map((exhibit, i) => (
              <div
                key={i}
                className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl"
              >
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-400/90">
                  {safeStr((exhibit as Record<string, unknown>).title)}
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-black">
                  <pre className="whitespace-pre-wrap text-xs leading-6 font-mono text-gray-300 bg-transparent border-0 p-0">
                    {safeStr((exhibit as Record<string, unknown>).content)}
                  </pre>
                </div>
              </div>
            ))}

            {/* Task + Question */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm font-black leading-7 text-white">{safeStr(scenario.task)}</p>
            </div>

            <div className="rounded-[1.75rem] border-2 border-cyan-400/40 bg-cyan-400/[0.06] p-6 backdrop-blur-xl">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Your question
              </p>
              <p className="text-base font-black leading-7 text-white">{safeStr(scenario.question)}</p>
            </div>

            {/* Guidance — guard against non-array and non-string tips */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                Guidance
              </h2>
              <ul className="space-y-2">
                {Array.isArray(scenario.guidance) && scenario.guidance.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-black text-cyan-400">
                      {i + 1}
                    </span>
                    {safeStr(tip)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Answer + Feedback */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {!feedback ? (
              <>
                {/* Timer */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
                      Time remaining
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {wordCount} words
                    </p>
                  </div>
                  <div
                    className={`font-mono text-4xl font-black text-center ${timerColour} ${
                      timerPulse ? "animate-pulse" : ""
                    }`}
                  >
                    {timerExpired ? "00:00" : formatTime(timeRemaining)}
                  </div>
                  {!timerStarted && (
                    <p className="mt-2 text-center text-xs text-gray-600">
                      Timer starts when you begin typing
                    </p>
                  )}
                  {timerExpired && (
                    <p className="mt-2 text-center text-xs font-black text-red-400">
                      Time is up!
                    </p>
                  )}
                </div>

                {/* Textarea */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-xl">
                  <textarea
                    value={response}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Begin your structured response here. Lead with your recommendation, then support with analysis from the exhibits…"
                    className="w-full min-h-[400px] resize-y rounded-xl border-0 bg-transparent text-sm leading-7 text-white placeholder-gray-700 outline-none focus:ring-0"
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={wordCount < 50 || submitting}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-black transition-all ${
                    wordCount >= 50 && !submitting
                      ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-900/30 hover:scale-[1.01]"
                      : "cursor-not-allowed bg-white/[0.05] text-gray-600"
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Scoring your response…
                    </>
                  ) : wordCount < 50 ? (
                    `Write at least 50 words (${wordCount}/50)`
                  ) : (
                    "Submit case study →"
                  )}
                </button>
              </>
            ) : (
              /* Feedback */
              <div className="space-y-4">
                {/* Overall score */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-3">
                    Case Study Score
                  </p>
                  <div
                    className={`text-6xl font-black ${
                      feedback.overall >= 7
                        ? "text-emerald-400"
                        : feedback.overall >= 5
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {feedback.overall.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">/ 10</div>
                  <p className="mt-4 text-sm leading-7 text-gray-300">{feedback.commentary}</p>
                </div>

                {/* Score bars */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-2">
                    Dimension scores
                  </p>
                  <ScoreBar label="Structure" score={feedback.scores.structure} />
                  <ScoreBar label="Analysis" score={feedback.scores.analysis} />
                  <ScoreBar label="Recommendations" score={feedback.scores.recommendations} />
                  <ScoreBar label="Commercial awareness" score={feedback.scores.commercialAwareness} />
                  <ScoreBar label="Communication" score={feedback.scores.communication} />
                </div>

                {/* Strengths */}
                <div className="rounded-[1.75rem] border border-emerald-500/[0.18] bg-emerald-500/[0.04] p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                    Strengths
                  </p>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-emerald-400">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="rounded-[1.75rem] border border-amber-500/[0.18] bg-amber-500/[0.04] p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">
                    Areas to improve
                  </p>
                  <ul className="space-y-2">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-amber-400">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Model answer */}
                {feedback.modelAnswer && (
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-400">
                      What an excellent answer would include
                    </p>
                    <p className="text-sm leading-7 text-gray-400">{feedback.modelAnswer}</p>
                  </div>
                )}

                {/* CTA — navigate to whichever stage comes next */}
                {(() => {
                  const stages = session?.selectedStages ?? [];
                  const nextHref = stages.includes("stage2")
                    ? `/assessment-centre/${id}/stage-2`
                    : stages.includes("stage3")
                    ? `/assessment-centre/${id}/stage-3`
                    : `/assessment-centre/${id}/report`;
                  const nextLabel = stages.includes("stage2")
                    ? "Continue to Stage 2 — Interview →"
                    : stages.includes("stage3")
                    ? "Continue to Stage 3 — Presentation →"
                    : "View your report →";
                  return (
                    <button
                      onClick={() => router.push(nextHref)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
                    >
                      {nextLabel}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </CandidateAppShell>
  );
}
