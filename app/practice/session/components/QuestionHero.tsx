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
  /** When true the session is keyboard-only — hide all voice controls. */
  freePlan?: boolean;
  /** Tablet only: show the one-time "automate the rest?" prompt after the first
   *  question has played. */
  showAutoFlowPrompt?: boolean;
  /** Called with the candidate's choice from the auto-flow prompt. */
  onAutoFlowDecision?: (enable: boolean) => void;
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
    freePlan,
    showAutoFlowPrompt,
    onAutoFlowDecision,
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
          className="h-full bg-gradient-to-r from-violet-300 to-purple-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold text-cyan-100 sm:text-xs">
                Question {currentQuestionNumber}/{totalQuestions}
              </span>

              <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-[11px] font-bold text-purple-100 sm:text-xs">
                {practiceModeLabels[practiceMode]}
              </span>

              {speakerEnabled && (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold text-emerald-100 sm:text-xs">
                  Audio
                </span>
              )}
            </div>

            <div className="mt-3 hidden flex-wrap gap-2 text-[11px] font-bold text-gray-400 sm:flex">
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
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1]"
            >
              Back
            </button>
          )}
        </div>

        {/* Voice controls — hidden for keyboard-only (free plan) sessions */}
        {!freePlan && (
          <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <button
              type="button"
              onClick={onStartGuidedAnswer}
              disabled={guidedDisabled}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Play question only
              </button>
            )}

            {isSpeakingQuestion && (
              <button
                type="button"
                onClick={onStopQuestion}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
              >
                Stop audio
              </button>
            )}
          </div>
        )}

        {showAutoFlowPrompt && (
          <div className="mb-3 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3">
            <p className="text-sm font-bold text-white">
              Play each question and start recording automatically?
            </p>
            <p className="mt-0.5 text-[12px] leading-5 text-gray-300">
              So you don&apos;t have to tap for every question. We&apos;ll remember
              your choice.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => onAutoFlowDecision?.(true)}
                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-fuchsia-100"
              >
                Yes, automate
              </button>
              <button
                type="button"
                onClick={() => onAutoFlowDecision?.(false)}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1]"
              >
                No, I&apos;ll tap
              </button>
            </div>
          </div>
        )}

        <div className="flex rounded-[1.25rem] border border-cyan-300/15 bg-cyan-300/10 px-4 py-4 sm:px-5 xl:flex-1">
          <p data-testid="question-text" className="self-start text-[1rem] font-bold leading-7 text-white sm:text-[1.08rem] sm:leading-8 xl:text-[1.08rem] 2xl:text-[1.16rem]">
            {questionLoading ? "Generating your question..." : question}
          </p>
        </div>

        {!freePlan && displayAudioMessage && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-xs font-semibold leading-5 text-gray-300 sm:text-sm sm:leading-6">
              {displayAudioMessage}
            </p>
          </div>
        )}

        {role && (
          <p className="mt-3 line-clamp-1 text-[11px] font-semibold text-gray-400 sm:hidden">
            {role}
          </p>
        )}
      </div>
    </section>
  );
}