"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { StageProgress } from "@/app/assessment-centre/components/StageProgress";

const PREP_TIME = 3 * 60; // 180s
const PRESENT_TIME = 3 * 60; // 180s

type PresentationBrief = {
  topic: string;
  audience: string;
  context: string;
  format: string;
  objectives: string[];
  timeMinutes: number;
};

type FeedbackScores = {
  structure: number;
  content: number;
  persuasion: number;
  clarity: number;
  delivery: number;
};

type Feedback = {
  scores: FeedbackScores;
  overall: number;
  commentary: string;
  strengths: string[];
  improvements: string[];
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
  presentationBrief: PresentationBrief;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const colour = score >= 7 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-gray-400 shrink-0">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-white/[0.08]">
        <div className={`absolute inset-y-0 left-0 rounded-full ${colour} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-black text-white">{score}</span>
    </div>
  );
}

export default function Stage3Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState("");

  const [phase, setPhase] = useState<"prep" | "presenting" | "submitted">("prep");
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME);
  const [presentTimeLeft, setPresentTimeLeft] = useState(PRESENT_TIME);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const interimRef = useRef("");

  const wordCount = transcript.trim() === "" ? 0 : transcript.trim().split(/\s+/).length;

  // Ensure the page starts at the top when navigating from stage-2
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  useEffect(() => {
    fetch(`/api/assessment-centre/${id}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        if (!d.id || typeof d.status !== "string") {
          setLoadError("Session not found or access denied. Please start a new session.");
          return;
        }
        const session = data as Session;
        if (session.status === "stage1") { router.replace(`/assessment-centre/${id}/stage-1`); return; }
        if (session.status === "stage2") { router.replace(`/assessment-centre/${id}/stage-2`); return; }
        if (session.status === "complete") { router.replace(`/assessment-centre/${id}/report`); return; }
        // If stage3 was not selected, skip straight to report
        if (session.selectedStages && !session.selectedStages.includes("stage3")) {
          router.replace(`/assessment-centre/${id}/report`);
          return;
        }
        setSession(session);
      })
      .catch(() => setLoadError("Failed to load session. Please refresh."));
  }, [id, router]);

  // Prep timer countdown
  useEffect(() => {
    if (phase !== "prep") return;
    timerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("presenting");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Present timer countdown
  useEffect(() => {
    if (phase !== "presenting") return;
    timerRef.current = setInterval(() => {
      setPresentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPresenting = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("presenting");
    setPresentTimeLeft(PRESENT_TIME);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition)) as (new () => unknown) | undefined;

    if (!SpeechRecognition) {
      setTranscript((t) => t + " [Voice not supported in this browser. Please type your presentation below]");
      return;
    }

    const rec = new SpeechRecognition() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: ((e: {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
      }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-GB";

    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      if (final) {
        setTranscript((prev) => prev + final);
        interimRef.current = interim;
      } else {
        interimRef.current = interim;
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.onerror = () => {
      setIsRecording(false);
    };

    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  async function handleSubmit() {
    if (submitting) return;
    if (wordCount < 80 && presentTimeLeft > 0) return;

    stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/assessment-centre/${id}/submit-presentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setFeedback(data.report ? null : (data as { feedback?: Feedback }).feedback ?? null);
      // The API generates the full report inline, navigate to report page
      setPhase("submitted");
      setFeedback((data as { feedback?: Feedback }).feedback ?? null);
    } catch {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const prepColour = prepTimeLeft <= 30 ? "text-red-400" : prepTimeLeft <= 60 ? "text-amber-400" : "text-cyan-300";
  const presentColour = presentTimeLeft <= 30 ? "text-red-400" : presentTimeLeft <= 60 ? "text-amber-400" : "text-emerald-400";

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
            <svg className="h-8 w-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Loading Stage 3…</p>
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  const brief = session.presentationBrief;

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <StageProgress currentStage={3} selectedStages={session.selectedStages} />

        {/* ─── Phase: Prep ─── */}
        {phase === "prep" && (
          <div className="space-y-6">
            <div className="mb-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                Stage 3 of 3 · Preparation time
              </div>
              <h1 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Presentation{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  Simulation
                </span>
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Review the brief carefully. Your 3-minute presentation begins after the prep timer.
              </p>
            </div>

            {/* Prep timer */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-2">
                Preparation time
              </p>
              <div className={`font-mono text-5xl font-black ${prepColour} ${prepTimeLeft <= 30 ? "animate-pulse" : ""}`}>
                {formatTime(prepTimeLeft)}
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Review the brief. Your presentation starts automatically when this reaches 0:00.
              </p>
            </div>

            {/* Brief */}
            <div className="rounded-[1.75rem] border border-cyan-500/[0.18] bg-cyan-500/[0.04] p-6 backdrop-blur-xl">
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-400">
                Presentation topic
              </p>
              <h2 className="text-xl font-black text-white">{brief.topic}</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Audience</p>
                <p className="text-sm text-gray-300">{brief.audience}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Format</p>
                <p className="text-sm text-gray-300">{brief.format}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Context</p>
              <p className="text-sm leading-7 text-gray-300">{brief.context}</p>
            </div>

            {brief.objectives?.length > 0 && (
              <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
                  What the audience expects
                </p>
                <ul className="space-y-2">
                  {brief.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-black text-cyan-400">
                        {i + 1}
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-[1.75rem] border border-purple-500/[0.15] bg-purple-500/[0.04] p-5 backdrop-blur-xl">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-purple-400">
                Tips for your 3-minute presentation
              </p>
              <ul className="space-y-2">
                {[
                  "Open with a clear position or recommendation",
                  "Use the PREP structure: Point, Reason, Example, Point again",
                  "Leave 20 seconds at the end to summarise your key message",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-purple-200/70">
                    <span className="mt-0.5 text-purple-400">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={startPresenting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-5 text-base font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.015]"
            >
              I&apos;m ready to present →
            </button>
          </div>
        )}

        {/* ─── Phase: Presenting ─── */}
        {phase === "presenting" && (
          <div className="space-y-5">
            <div className="mb-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-200">
                {isRecording ? (
                  <>
                    <span className="flex h-2 w-2">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                    </span>
                    Recording
                  </>
                ) : "Presentation stage"}
              </div>
              <h1 className="text-2xl font-black tracking-[-0.04em] text-white">
                {brief.topic}
              </h1>
              <p className="mt-1 text-sm text-gray-500">Audience: {brief.audience}</p>
            </div>

            {/* Big timer */}
            <div className={`rounded-[1.75rem] border p-6 text-center backdrop-blur-xl ${
              presentTimeLeft <= 30
                ? "border-red-500/30 bg-red-500/[0.06]"
                : "border-white/[0.07] bg-white/[0.04]"
            }`}>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-2">
                Time remaining
              </p>
              <div className={`font-mono text-6xl font-black ${presentColour} ${presentTimeLeft <= 30 ? "animate-pulse" : ""}`}>
                {formatTime(presentTimeLeft)}
              </div>
              {presentTimeLeft === 0 && (
                <p className="mt-2 text-xs font-black text-red-400">Time is up. Submit your presentation</p>
              )}
            </div>

            {/* Recording controls */}
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all ${
                    isRecording
                      ? "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
                      : "bg-cyan-400/10 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/20"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                      </span>
                      Stop recording
                    </>
                  ) : (
                    <>
                      <span>🎤</span>
                      Start recording
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-600">{wordCount} words captured</span>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your speech will appear here as you speak. You can also type directly or edit what was captured."
                className="w-full min-h-[200px] resize-y rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm leading-7 text-gray-300 placeholder-gray-700 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={(wordCount < 80 && presentTimeLeft > 0) || submitting}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-base font-black transition-all ${
                (wordCount >= 80 || presentTimeLeft === 0) && !submitting
                  ? "bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 text-white shadow-2xl shadow-cyan-900/40 hover:scale-[1.015]"
                  : "cursor-not-allowed bg-white/[0.05] text-gray-600"
              }`}
            >
              {submitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scoring your presentation and generating report…
                </>
              ) : wordCount < 80 && presentTimeLeft > 0 ? (
                `Speak or type at least 80 words (${wordCount}/80)`
              ) : (
                "Submit presentation →"
              )}
            </button>
            {submitting && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.07] px-4 py-3 text-left text-xs leading-5 text-cyan-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-cyan-300" aria-hidden><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span>
                  <span className="font-black">This is the longest step, usually one to two minutes.</span>{" "}
                  We are scoring your presentation and compiling your final
                  report across every stage. Keep this page open.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ─── Phase: Submitted / Feedback ─── */}
        {phase === "submitted" && (
          <div className="space-y-5">
            <div className="mb-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
                Stage 3 complete
              </div>
              <h1 className="text-3xl font-black tracking-[-0.05em] text-white">
                Presentation scored
              </h1>
            </div>

            {submitting && !feedback && (
              <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-10 text-center backdrop-blur-xl">
                <svg className="mx-auto h-8 w-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">Generating your final report…</p>
              </div>
            )}

            {feedback && (
              <>
                {/* Overall */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-3">
                    Presentation Score
                  </p>
                  <div className={`text-6xl font-black ${
                    feedback.overall >= 7 ? "text-emerald-400" : feedback.overall >= 5 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {feedback.overall.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">/ 10</div>
                  <p className="mt-4 text-sm leading-7 text-gray-300">{feedback.commentary}</p>
                </div>

                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 mb-2">
                    Dimension scores
                  </p>
                  <ScoreBar label="Structure" score={feedback.scores.structure} />
                  <ScoreBar label="Content" score={feedback.scores.content} />
                  <ScoreBar label="Persuasion" score={feedback.scores.persuasion} />
                  <ScoreBar label="Clarity" score={feedback.scores.clarity} />
                  <ScoreBar label="Delivery" score={feedback.scores.delivery} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-emerald-500/[0.18] bg-emerald-500/[0.04] p-5 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">Strengths</p>
                    <ul className="space-y-2">
                      {feedback.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-emerald-400">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1.75rem] border border-amber-500/[0.18] bg-amber-500/[0.04] p-5 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">Improvements</p>
                    <ul className="space-y-2">
                      {feedback.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-amber-400">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {feedback.exampleAnswer && (
                  <div className="rounded-[1.75rem] border border-purple-400/20 bg-purple-400/[0.06] p-5 backdrop-blur-xl">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-purple-300">
                      Model Answer Example
                    </p>
                    <p className="text-sm leading-7 text-gray-300 whitespace-pre-line">{feedback.exampleAnswer}</p>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => router.push(`/assessment-centre/${id}/report`)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-5 text-base font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.015]"
            >
              View your full report →
            </button>
          </div>
        )}
      </div>
    </CandidateAppShell>
  );
}
