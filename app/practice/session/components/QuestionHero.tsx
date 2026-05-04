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
  role,
  interviewType,
  difficulty,
  focusArea,
  practiceMode,
  averageQuestionScore,
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

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                Question {currentQuestionNumber}/{totalQuestions}
              </span>
              <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-black text-purple-100">
                {practiceModeLabels[practiceMode]}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-gray-300">
                Avg {averageQuestionScore}/10
              </span>
              {speakerEnabled && (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                  Natural audio
                </span>
              )}
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Current question
            </p>
            <p className="mt-1 max-w-5xl text-xs leading-5 text-gray-500 sm:text-sm">
              {role} · {interviewType} · {difficulty} difficulty · Focus:{" "}
              {focusArea}
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToSetup}
            className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.1]"
          >
            Back to setup
          </button>
        </div>

        <div className="rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-4 sm:p-5">
          <p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8 lg:text-[1.25rem] lg:leading-9">
            {questionLoading ? "Generating your question..." : question}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
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

          {(questionAudioMessage || questionAudioError) && (
            <p className="text-sm leading-6 text-gray-400 lg:ml-auto lg:max-w-xl">
              {questionAudioError || questionAudioMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}