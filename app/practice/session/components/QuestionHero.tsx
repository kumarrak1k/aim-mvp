"use client";

import type { PracticeMode } from "../../types";
import { practiceModeLabels } from "../utils";

type QuestionHeroProps = {
  question: string;
  questionLoading: boolean;
  currentQuestionNumber: number;
  totalQuestions: number;
  role: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  practiceMode: PracticeMode;
  averageQuestionScore: number;
  speakerEnabled: boolean;
  speakerSupported: boolean;
  questionAudioLoading: boolean;
  questionAudioReady: boolean;
  questionAudioError: string;
  questionAudioMessage: string;
  isSpeakingQuestion: boolean;
  isListening: boolean;
  guidedAnswerRunning: boolean;
  onPlayQuestion: () => void;
  onStopQuestion: () => void;
  onStartGuidedAnswer: () => void;
  onBackToSetup: () => void;
};

export function QuestionHero({
  question,
  questionLoading,
  currentQuestionNumber,
  totalQuestions,
  practiceMode,
  speakerEnabled,
  speakerSupported,
  questionAudioLoading,
  questionAudioReady,
  questionAudioError,
  questionAudioMessage,
  isSpeakingQuestion,
  isListening,
  guidedAnswerRunning,
  onPlayQuestion,
  onStopQuestion,
  onStartGuidedAnswer,
  onBackToSetup,
}: QuestionHeroProps) {
  const progressPercent = Math.min(
    100,
    Math.round(((currentQuestionNumber - 1) / totalQuestions) * 100)
  );

  const displayAudioMessage =
    questionAudioError ||
    (questionAudioMessage.includes("Auto-play was blocked")
      ? "Press Play question + record when you are ready."
      : questionAudioMessage);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
              Question {currentQuestionNumber}/{totalQuestions}
            </span>

            <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-black text-purple-100">
              {practiceModeLabels[practiceMode]}
            </span>

            {speakerEnabled && (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                Audio
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition hover:bg-white/[0.1]"
          >
            Back
          </button>
        </div>

        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onStartGuidedAnswer}
            disabled={
              questionLoading ||
              !question ||
              isSpeakingQuestion ||
              isListening ||
              guidedAnswerRunning ||
              (questionAudioLoading && !questionAudioReady)
            }
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isListening
              ? "Recording..."
              : guidedAnswerRunning
                ? "Starting..."
                : questionAudioLoading && !questionAudioReady
                  ? "Preparing audio..."
                  : "Play question + record"}
          </button>

          {!isSpeakingQuestion && (speakerSupported || speakerEnabled) && (
            <button
              type="button"
              onClick={onPlayQuestion}
              disabled={
                questionLoading ||
                !question ||
                (questionAudioLoading && !questionAudioReady)
              }
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Play question only
            </button>
          )}

          {isSpeakingQuestion && (
            <button
              type="button"
              onClick={onStopQuestion}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              Stop audio
            </button>
          )}
        </div>

        <div className="rounded-[1.25rem] border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-[1rem] font-bold leading-7 text-white sm:text-[1.1rem] sm:leading-8 lg:text-[1.15rem]">
            {questionLoading ? "Generating your question..." : question}
          </p>
        </div>

        {displayAudioMessage && (
          <p className="mt-3 text-sm leading-6 text-gray-400">
            {displayAudioMessage}
          </p>
        )}
      </div>
    </section>
  );
}