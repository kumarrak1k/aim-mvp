"use client";

import type { Feedback } from "../../types";

type AnswerWorkspaceProps = {
  answer: string;
  question: string;
  feedback: Feedback | null;
  voiceSupported: boolean;
  isListening: boolean;
  isSpeakingQuestion: boolean;
  questionLoading: boolean;
  questionAudioLoading: boolean;
  cleaningTranscript: boolean;
  feedbackLoading: boolean;
  voiceAnalysisLoading: boolean;
  videoAnalysisLoading: boolean;
  onAnswerChange: (value: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onClear: () => void;
  onFeedback: () => void;
  /** Scrolls the page to the feedback section when feedback is ready. */
  onViewFeedback?: () => void;
  /** When true, the candidate is taking a company-issued assessment.
   *  Hide all references to feedback/scoring — the action is simply submitting
   *  the answer for the company to review later. */
  assessmentMode?: boolean;
  /** When true the session is keyboard-only — hide all recording controls. */
  freePlan?: boolean;
};

export function AnswerWorkspace({
  answer,
  question,
  feedback,
  voiceSupported,
  isListening,
  isSpeakingQuestion,
  questionLoading,
  questionAudioLoading,
  cleaningTranscript,
  feedbackLoading,
  voiceAnalysisLoading,
  videoAnalysisLoading,
  onAnswerChange,
  onStartVoice,
  onStopVoice,
  onClear,
  onFeedback,
  onViewFeedback,
  assessmentMode = false,
  freePlan = false,
}: AnswerWorkspaceProps) {
  const analysing = feedbackLoading || voiceAnalysisLoading || videoAnalysisLoading;

  const submitDesktopLabel = feedbackLoading
    ? assessmentMode
      ? "Submitting..."
      : "Preparing feedback..."
    : voiceAnalysisLoading || videoAnalysisLoading
      ? assessmentMode
        ? "Recording answer..."
        : "Analysing delivery..."
      : assessmentMode
        ? "Submit answer"
        : "Get AI feedback";

  const submitMobileLabel = feedbackLoading
    ? assessmentMode
      ? "Submitting..."
      : "Preparing..."
    : voiceAnalysisLoading || videoAnalysisLoading
      ? assessmentMode
        ? "Recording..."
        : "Analysing..."
      : assessmentMode
        ? "Submit"
        : "Get feedback";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl xl:min-h-[420px]">
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-300">
                Your answer
              </p>

              {cleaningTranscript && (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black text-cyan-100">
                  Cleaning transcript
                </span>
              )}

            </div>

            <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl xl:text-xl 2xl:text-2xl">
              {freePlan ? "Answer editor" : "Transcript and answer editor"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFeedback}
            disabled={
              !question.trim() ||
              !answer.trim() ||
              Boolean(feedback) ||
              analysing ||
              questionAudioLoading
            }
            className="hidden rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
          >
            {submitDesktopLabel}
          </button>
        </div>

        {/* Feedback-ready banner — appears once AI feedback has loaded */}
        {feedback && !assessmentMode && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 animate-pulse-once">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-300">
                ✓
              </span>
              <p className="text-sm font-black text-emerald-100">
                AI feedback is ready
              </p>
            </div>
            {onViewFeedback && (
              <button
                type="button"
                onClick={onViewFeedback}
                className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-1.5 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/25"
              >
                View feedback ↓
              </button>
            )}
          </div>
        )}

        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder={
            freePlan
              ? assessmentMode
                ? "Type your answer here. You can edit it before submitting."
                : "Type your answer here. You can edit it before requesting feedback."
              : assessmentMode
                ? "Your answer transcript will appear here. You can also type or edit your answer before submitting it."
                : "Your answer transcript will appear here. You can also type or edit your answer before requesting feedback."
          }
          className="min-h-[240px] flex-1 resize-none rounded-[1.25rem] border border-white/10 bg-black/30 p-4 text-base leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10 sm:min-h-[300px] xl:min-h-[310px]"
        />

        {/* Recording controls hidden for keyboard-only (free plan) sessions */}
        <div className={`mt-3 grid gap-3 ${freePlan ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {!freePlan && (
            <>
              {!isListening ? (
                <button
                  type="button"
                  onClick={onStartVoice}
                  disabled={!voiceSupported || questionLoading || isSpeakingQuestion}
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStopVoice}
                  className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-300/15"
                >
                  Stop recording
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={onClear}
            disabled={!answer || analysing}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear answer
          </button>

          <button
            type="button"
            onClick={onFeedback}
            disabled={
              !question.trim() ||
              !answer.trim() ||
              Boolean(feedback) ||
              analysing ||
              questionAudioLoading
            }
            className={`rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 ${freePlan ? "" : "sm:hidden"}`}
          >
            {submitMobileLabel}
          </button>
        </div>
      </div>
    </section>
  );
}