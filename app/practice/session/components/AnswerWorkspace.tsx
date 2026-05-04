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
}: AnswerWorkspaceProps) {
  const analysing = feedbackLoading || voiceAnalysisLoading || videoAnalysisLoading;

  return (
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[1.55rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-300">
              Your answer
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-black tracking-[-0.035em] text-white sm:text-2xl xl:text-xl 2xl:text-2xl">
                Transcript and answer editor
              </h2>

              {cleaningTranscript && (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
                  Cleaning transcript
                </span>
              )}
            </div>
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
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {feedbackLoading
              ? "Preparing feedback..."
              : voiceAnalysisLoading || videoAnalysisLoading
                ? "Analysing delivery..."
                : "Get AI feedback"}
          </button>
        </div>

        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="Your answer transcript will appear here. You can also type or edit your answer before requesting feedback."
          className="min-h-[310px] flex-1 resize-none rounded-[1.35rem] border border-white/10 bg-black/30 p-4 text-base leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
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

          <button
            type="button"
            onClick={onClear}
            disabled={!answer || analysing}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear answer
          </button>
        </div>
      </div>
    </section>
  );
}