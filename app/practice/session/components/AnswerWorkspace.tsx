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
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-purple-300">
              Your answer
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              Transcript and answer editor
            </h2>
          </div>

          {cleaningTranscript && (
            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
              Cleaning transcript
            </span>
          )}
        </div>

        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="Your answer transcript will appear here. You can also type or edit your answer before requesting feedback."
          className="min-h-[240px] w-full resize-none rounded-[1.6rem] border border-white/10 bg-black/30 p-5 text-base leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10 sm:min-h-[260px] lg:min-h-[280px]"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-2"
          >
            {feedbackLoading
              ? "Preparing feedback..."
              : voiceAnalysisLoading || videoAnalysisLoading
                ? "Analysing delivery..."
                : "Get AI feedback"}
          </button>
        </div>
      </div>
    </section>
  );
}