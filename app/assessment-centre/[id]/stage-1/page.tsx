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
  exampleAnswer?: string;
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
  if (Array.isArray(v)) return (v as unknown[]).map((x) => safeStr(x)).join("\n");
  return JSON.stringify(v);
}

/** Parse a markdown pipe-table string into header + body rows */
function parsePipeTable(lines: string[]): { header: string[]; rows: string[][] } | null {
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  if (tableLines.length < 2) return null;
  const dataLines = tableLines.filter((l) => !/^\|[\s\-:|]+\|$/.test(l.trim()));
  if (dataLines.length < 1) return null;
  const splitRow = (l: string) =>
    l.split("|").slice(1, -1).map((c) => c.trim());
  const [header, ...rows] = dataLines.map(splitRow);
  return { header, rows };
}

/** Render a single exhibit's content intelligently */
function ExhibitContent({ content }: { content: unknown }) {
  const raw = safeStr(content);
  const lines = raw.split("\n").map((l) => l.trimEnd());

  // ── Markdown pipe table ──────────────────────────────────────────────────
  const parsed = parsePipeTable(lines);
  if (parsed) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {parsed.header.map((cell, i) => (
                <th
                  key={i}
                  className="border border-white/10 bg-white/5 px-3 py-2 text-left font-bold text-gray-200"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "" : "bg-white/[0.02]"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-white/10 px-3 py-1.5 text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Bullet list (lines starting with - / • / *) ──────────────────────────
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  const isBullet = (l: string) => /^[-•*]\s/.test(l.trim());
  if (nonEmpty.length > 0 && nonEmpty.every(isBullet)) {
    return (
      <ul className="space-y-1.5">
        {nonEmpty.map((l, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
            {l.replace(/^[-•*]\s+/, "")}
          </li>
        ))}
      </ul>
    );
  }

  // ── Mixed content — group into bullets and prose blocks ─────────────────
  return (
    <div className="space-y-1">
      {nonEmpty.map((l, i) => {
        if (isBullet(l)) {
          return (
            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
              <span>{l.replace(/^[-•*]\s+/, "")}</span>
            </div>
          );
        }
        // Label lines (e.g. "Revenue: $X") rendered as key-value
        if (/^[A-Z][^:]{0,40}:\s/.test(l)) {
          const colon = l.indexOf(":");
          return (
            <div key={i} className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 font-bold text-gray-400">{l.slice(0, colon)}:</span>
              <span className="text-gray-300">{l.slice(colon + 1).trimStart()}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-6 text-gray-300">{l}</p>
        );
      })}
    </div>
  );
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
      <span className="w-8 text-right text-xs font-bold text-white">{score}</span>
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

      // Gateway timeouts return non-JSON — parse defensively so they surface
      // as a retryable error instead of a bogus "could not reach the server".
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.feedback) {
        setSubmitError(
          data?.error ??
            "Marking took too long or the server had a problem. Your answer is kept — please try again."
        );
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
      <div className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-4 py-8 sm:px-6">
        <StageProgress currentStage={1} selectedStages={session.selectedStages} />

        <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
          {/* Left: Scenario — copy/paste disabled to preserve assessment integrity */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="space-y-5 select-none"
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              const blocked = (e.ctrlKey || e.metaKey) && ["a", "c", "x"].includes(e.key.toLowerCase());
              if (blocked) e.preventDefault();
            }}
          >
            {/* Company header */}
            <div className="rounded-[1.75rem] border border-purple-500/[0.18] bg-purple-500/[0.05] p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-purple-300/90">
                    Stage 1 · Case Study Analysis
                  </p>
                  <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                    {safeStr(scenario.company)}
                  </h1>
                </div>
                <span className="shrink-0 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1.5 text-xs font-bold text-purple-300">
                  {safeStr(scenario.industry)}
                </span>
              </div>
              <p className="mt-3 text-[10px] text-purple-300/50 flex items-center gap-1.5">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Copying is disabled. Complete this exercise using only the information provided.
              </p>
            </div>

            {/* Overview */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-2 text-[11px] font-bold tracking-wide text-gray-400">
                Background
              </h2>
              <p className="text-sm leading-7 text-gray-300">{safeStr(scenario.overview)}</p>
            </div>

            {/* Challenge */}
            <div className="rounded-[1.75rem] border border-amber-500/[0.18] bg-amber-500/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-2 text-[11px] font-bold tracking-wide text-amber-400/90">
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
                <h2 className="mb-3 text-[11px] font-bold tracking-wide text-cyan-400/90">
                  {safeStr((exhibit as Record<string, unknown>).title)}
                </h2>
                <ExhibitContent content={(exhibit as Record<string, unknown>).content} />
              </div>
            ))}

            {/* Task + Question */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm font-bold leading-7 text-white">{safeStr(scenario.task)}</p>
            </div>

            <div className="rounded-[1.75rem] border-2 border-cyan-400/40 bg-cyan-400/[0.06] p-6 backdrop-blur-xl">
              <p className="mb-2 text-[10px] font-bold tracking-wide text-cyan-400">
                Your question
              </p>
              <p className="text-base font-bold leading-7 text-white">{safeStr(scenario.question)}</p>
            </div>

            {/* Guidance — guard against non-array and non-string tips */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">
                Guidance
              </h2>
              <ul className="space-y-2">
                {Array.isArray(scenario.guidance) && scenario.guidance.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-400">
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
                    <p className="text-[11px] font-bold tracking-wide text-gray-500">
                      Time remaining
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {wordCount} words
                    </p>
                  </div>
                  <div
                    className={`font-mono text-4xl font-bold text-center ${timerColour} ${
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
                    <p className="mt-2 text-center text-xs font-bold text-red-400">
                      Time is up!
                    </p>
                  )}
                </div>

                {/* Textarea */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-xl">
                  <textarea
                    value={response}
                    onChange={(e) => handleTextChange(e.target.value)}
                    // Assessment integrity — the timed exercise must be the
                    // candidate's own typed work, so pasted or dropped-in
                    // text is rejected.
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    placeholder="Begin your structured response here. Lead with your recommendation, then support with analysis from the exhibits…"
                    className="w-full min-h-[400px] resize-y rounded-xl border-0 bg-transparent text-sm leading-7 text-white placeholder-gray-700 outline-none focus:ring-0"
                  />
                  <p className="mt-1 px-1 text-xs text-gray-600">
                    Pasting is disabled — this timed exercise must be your own typed work.
                  </p>
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={wordCount < 50 || submitting}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
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
                {submitting && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.07] px-4 py-3 text-left text-xs leading-5 text-cyan-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-cyan-300" aria-hidden><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span>
                      <span className="font-bold">Marking takes up to a minute.</span>{" "}
                      Your response is being scored against the full case pack.
                      Keep this page open.
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* Feedback */
              <div className="space-y-4">
                {/* Overall score */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl text-center">
                  <p className="text-[11px] font-bold tracking-wide text-gray-500 mb-3">
                    Case Study Score
                  </p>
                  <div
                    className={`text-5xl font-bold ${
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
                  <p className="text-[11px] font-bold tracking-wide text-gray-500 mb-2">
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
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-emerald-400">
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
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-amber-400">
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
                    <p className="mb-2 text-[11px] font-bold tracking-wide text-cyan-400">
                      What an excellent answer would include
                    </p>
                    <p className="text-sm leading-7 text-gray-400">{feedback.modelAnswer}</p>
                  </div>
                )}

                {/* Example model answer */}
                {feedback.exampleAnswer && (
                  <div className="rounded-[1.75rem] border border-purple-400/20 bg-purple-400/[0.06] p-5 backdrop-blur-xl">
                    <p className="mb-2 text-[11px] font-bold tracking-wide text-purple-300">
                      Model Answer Example
                    </p>
                    <p className="text-sm leading-7 text-gray-300 whitespace-pre-line">{feedback.exampleAnswer}</p>
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
                    ? "Continue to Stage 2: Interview →"
                    : stages.includes("stage3")
                    ? "Continue to Stage 3: Presentation →"
                    : "View your report →";
                  return (
                    <button
                      onClick={() => router.push(nextHref)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
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
