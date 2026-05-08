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
  /** Hide the "Back" link when the candidate is taking a company-issued
   *  assessment — there's no setup to return to and abandoning loses the
   *  invite. */
  assessmentMode?: boolean;
};

export function QuestionHero(props: QuestionHeroProps) {
  const {
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
    assessmentMode,
  } = props;

  const progressPercent = Math.min(
    100,
    Math.round(((currentQuestionNumber - 1) / totalQuestions) * 100)
  );

  const displayAudioMessage =
    questionAudioError ||
    (questionAudioMessage.includes("Auto-play was blocked")
      ? "Press Play question + record when you are ready."
      : questionAudioMessage);

  const guidedDisabled =
    questionLoading ||
    !question ||
    isSpeakingQuestion ||
    isListening ||
    guidedAnswerRunning ||
    (questionAudioLoading && !questionAudioReady);

  const playOnlyDisabled =
    questionLoading || !question || (questionAudioLoading && !questionAudioReady);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl xl:min-h-[360px]">
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black text-cyan-100 sm:text-xs">
                Question {currentQuestionNumber}/{totalQuestions}
              </span>

              <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-[11px] font-black text-purple-100 sm:text-xs">
                {practiceModeLabels[practiceMode]}
              </span>

              {speakerEnabled && (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-100 sm:text-xs">
                  Audio
                </span>
              )}
            </div>

            <div className="mt-3 hidden flex-wrap gap-2 text-[11px] font-bold text-gray-500 sm:flex">
              <span>{interviewType}</span>
              <span>·</span>
              <span>{difficulty}</span>
              <span>·</span>
              <span>Focus: {focusArea}</span>
              {averageQuestionScore > 0 && !assessmentMode && (
                <>
                  <span>·</span>
                  <span>Avg {averageQuestionScore}/10</span>
                </>
              )}
            </div>
          </div>

          {!assessmentMode && (
            <button
              type="button"
              onClick={onBackToSetup}
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition hover:bg-white/[0.1]"
            >
              Back
            </button>
          )}
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <button
            type="button"
            onClick={onStartGuidedAnswer}
            disabled={guidedDisabled}
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
              disabled={playOnlyDisabled}
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

        <div className="flex rounded-[1.25rem] border border-cyan-300/15 bg-cyan-300/10 px-4 py-4 sm:px-5 xl:flex-1">
          <p className="self-start text-[1rem] font-bold leading-7 text-white sm:text-[1.08rem] sm:leading-8 xl:text-[1.08rem] 2xl:text-[1.16rem]">
            {questionLoading ? "Generating your question..." : question}
          </p>
        </div>

        {displayAudioMessage && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-xs font-semibold leading-5 text-gray-300 sm:text-sm sm:leading-6">
              {displayAudioMessage}
            </p>
          </div>
        )}

        {role && (
          <p className="mt-3 line-clamp-1 text-[11px] font-semibold text-gray-500 sm:hidden">
            {role}
          </p>
        )}
      </div>
    </section>
  );
}