"use client";

import type { Feedback } from "../types";
import { GlassCard } from "./PracticeUi";

type PracticeAnswerPanelProps = {
  feedback: Feedback | null;
  answer: string;
  question: string;
  questionLoading: boolean;
  voiceSupported: boolean;
  manualDeviceMode: boolean;
  questionAudioLoading: boolean;
  questionAudioReady: boolean;
  questionAudioError: string;
  isSpeakingQuestion: boolean;
  isListening: boolean;
  cameraEnabled: boolean;
  cleaningTranscript: boolean;
  guidedAnswerRunning: boolean;
  feedbackLoading: boolean;
  voiceAnalysisLoading: boolean;
  videoAnalysisLoading: boolean;
  getFeedback: () => void;
  startGuidedAnswer: () => void;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  clearVoiceAnswer: () => void;
  onAnswerChange: (value: string) => void;
};

export function PracticeAnswerPanel({
  feedback,
  answer,
  question,
  questionLoading,
  voiceSupported,
  manualDeviceMode,
  questionAudioLoading,
  questionAudioReady,
  questionAudioError,
  isSpeakingQuestion,
  isListening,
  cameraEnabled,
  cleaningTranscript,
  guidedAnswerRunning,
  feedbackLoading,
  voiceAnalysisLoading,
  videoAnalysisLoading,
  getFeedback,
  startGuidedAnswer,
  startVoiceInput,
  stopVoiceInput,
  clearVoiceAnswer,
  onAnswerChange,
}: PracticeAnswerPanelProps) {
  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const canRequestFeedback =
    Boolean(answer.trim()) &&
    !feedbackLoading &&
    !cleaningTranscript &&
    !isSpeakingQuestion &&
    !guidedAnswerRunning &&
    !voiceAnalysisLoading &&
    !videoAnalysisLoading;

  return (
    <GlassCard>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold tracking-wide text-purple-300">
            Your answer
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Record or type your response.
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Aim for a structured answer with context, action and measurable
            result. You can edit the transcript before requesting feedback.
          </p>
        </div>

        {!feedback && (
          <button
            onClick={getFeedback}
            disabled={!canRequestFeedback}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[180px]"
          >
            {feedbackLoading
              ? "Evaluating..."
              : voiceAnalysisLoading || videoAnalysisLoading
              ? "Analysing delivery..."
              : "Get AI Feedback"}
          </button>
        )}
      </div>

      {manualDeviceMode && question && (
        <div className="mb-4 overflow-hidden rounded-[1.6rem] border border-emerald-300/20 bg-emerald-300/10 shadow-xl shadow-emerald-950/10">
          <div className="p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/15 text-lg">
                🎙️
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-100">
                  Best phone/tablet flow
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-300">
                  Tap once. The coach plays the question with natural audio, then
                  opens your microphone for the answer.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startGuidedAnswer}
              disabled={
                questionLoading ||
                isSpeakingQuestion ||
                isListening ||
                (questionAudioLoading && !questionAudioReady)
              }
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-4 text-sm font-bold text-black shadow-2xl shadow-cyan-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSpeakingQuestion
                ? "Question playing..."
                : isListening
                ? "Recording answer..."
                : questionAudioLoading && !questionAudioReady
                ? "Preparing question audio..."
                : "Guided Answer: Hear Question + Start Recording"}
            </button>

            {questionAudioError && (
              <p className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                Audio note: {questionAudioError}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-wide text-cyan-300">
            Question reminder
          </p>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-gray-300">
            Keep answer relevant
          </span>
        </div>
        <p className="text-sm font-semibold leading-6 text-gray-100">
          {questionLoading ? "Generating question..." : question}
        </p>
      </div>

      <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/35 focus-within:border-purple-300/50 focus-within:ring-4 focus-within:ring-purple-500/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="text-xs font-bold tracking-wide text-gray-400">
            Transcript
          </p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
            <span>{wordCount} words</span>
            {isListening && (
              <span className="rounded-full border border-red-300/20 bg-red-300/10 px-2 py-1 text-red-100">
                Recording
              </span>
            )}
          </div>
        </div>

        <textarea
          className="min-h-[260px] w-full resize-y bg-transparent p-4 leading-7 text-white placeholder-gray-400 outline-none sm:min-h-[330px]"
          placeholder={
            voiceSupported
              ? "Speak or type your answer here..."
              : "Voice dictation may not be supported on this browser. Type your answer here..."
          }
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
        />
      </div>

      {voiceSupported ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          {isListening ? (
            <button
              onClick={stopVoiceInput}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-red-950/20 transition hover:bg-red-600"
            >
              Stop Voice Answer
            </button>
          ) : (
            <button
              onClick={startVoiceInput}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-purple-950/30 transition hover:opacity-95"
            >
              Start Voice Answer
            </button>
          )}

          <button
            onClick={clearVoiceAnswer}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/[0.1]"
          >
            Clear Answer
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4">
          <p className="text-sm leading-6 text-amber-100">
            Voice dictation is not available on this browser. You can still type
            your answer and receive AI feedback.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          label="Answer status"
          value={
            isSpeakingQuestion
              ? "Listening to question"
              : isListening
              ? "Recording"
              : answer.trim()
              ? "Ready for feedback"
              : "Waiting"
          }
        />
        <StatusCard
          label="Delivery"
          value={
            cleaningTranscript
              ? "Cleaning transcript"
              : voiceAnalysisLoading || videoAnalysisLoading
              ? "Analysing"
              : cameraEnabled
              ? "Voice + camera"
              : "Voice/text"
          }
        />
        <StatusCard
          label="Recommended"
          value={manualDeviceMode ? "Use Guided Answer" : "Use voice or type"}
        />
      </div>
    </GlassCard>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[11px] font-bold tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-gray-200">{value}</p>
    </div>
  );
}
