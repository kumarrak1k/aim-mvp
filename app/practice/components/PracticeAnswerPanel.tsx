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
  return (
    <GlassCard>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block text-sm font-black uppercase tracking-[0.2em] text-purple-300">
          Your answer
        </label>

        {!feedback && (
          <button
            onClick={getFeedback}
            disabled={
              !answer ||
              feedbackLoading ||
              cleaningTranscript ||
              isSpeakingQuestion ||
              guidedAnswerRunning ||
              voiceAnalysisLoading ||
              videoAnalysisLoading
            }
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {feedbackLoading ? "Evaluating..." : "Get AI Feedback"}
          </button>
        )}
      </div>

      {manualDeviceMode && question && (
        <div className="mb-4 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/10 p-4">
          <p className="text-sm font-black text-emerald-100">
            Recommended phone/tablet flow
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            Tap the button below. It starts camera if enabled, plays the question
            with AI-generated audio, then opens the microphone for your answer.
          </p>
          <button
            type="button"
            onClick={startGuidedAnswer}
            disabled={
              questionLoading ||
              isSpeakingQuestion ||
              isListening ||
              (questionAudioLoading && !questionAudioReady)
            }
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-5 py-4 text-sm font-black text-black shadow-2xl shadow-cyan-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSpeakingQuestion
              ? "Question Playing..."
              : isListening
              ? "Recording..."
              : questionAudioLoading && !questionAudioReady
              ? "Preparing Question Audio..."
              : "Guided Answer: Hear Question + Start Recording"}
          </button>
          {questionAudioError && (
            <p className="mt-3 text-xs leading-5 text-amber-100">
              Audio note: {questionAudioError}
            </p>
          )}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          Question reminder
        </p>
        <p className="text-sm font-semibold leading-6 text-gray-100">
          {questionLoading ? "Generating question..." : question}
        </p>
      </div>

      <textarea
        className="mb-5 min-h-[260px] w-full rounded-2xl border border-white/10 bg-black/35 p-4 leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10 sm:min-h-[330px]"
        placeholder={
          voiceSupported
            ? "Speak or type your answer here..."
            : "Voice dictation may not be supported on this browser. Type your answer here..."
        }
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
      />

      {voiceSupported ? (
        <div className="mb-5 flex flex-wrap gap-3">
          {isListening ? (
            <button
              onClick={stopVoiceInput}
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-red-950/20 transition hover:bg-red-600"
            >
              Stop Voice Answer
            </button>
          ) : (
            <button
              onClick={startVoiceInput}
              className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-purple-950/30 transition hover:opacity-95"
            >
              Start Voice Answer
            </button>
          )}

          <button
            onClick={clearVoiceAnswer}
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-gray-200 transition hover:bg-white/[0.1]"
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

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-sm leading-6 text-gray-400">
          {isSpeakingQuestion
            ? "Question is being read aloud..."
            : isListening
            ? cameraEnabled
              ? "Listening… keep speaking naturally. Voice and video are being measured."
              : "Listening… keep speaking naturally."
            : cleaningTranscript
            ? "Tidying transcript and punctuation..."
            : voiceAnalysisLoading || videoAnalysisLoading
            ? "Analysing delivery..."
            : manualDeviceMode
            ? "Phone/tablet mode: use Guided Answer for the smoothest flow, or type your answer."
            : "Voice input ready."}
        </p>
      </div>
    </GlassCard>
  );
}
