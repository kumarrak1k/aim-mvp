"use client";

import type { RefObject } from "react";

type PracticeCoachPanelProps = {
  role: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  speakerEnabled: boolean;
  isSpeakingQuestion: boolean;
  manualDeviceMode: boolean;
  isListening: boolean;
  questionAudioMessage: string;
  cameraEnabled: boolean;
  cameraRequiresTap: boolean;
  cameraError: string;
  cameraReady: boolean;
  startCameraFromTap: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  questionLoading: boolean;
  question: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  speakerSupported: boolean;
  questionAudioLoading: boolean;
  questionAudioReady: boolean;
  guidedAnswerRunning: boolean;
  startGuidedAnswer: () => void;
  playQuestionManually: () => void;
  stopQuestionSpeech: () => void;
};

function getCoachStatus({
  isSpeakingQuestion,
  isListening,
  cameraEnabled,
  cameraReady,
  questionLoading,
}: {
  isSpeakingQuestion: boolean;
  isListening: boolean;
  cameraEnabled: boolean;
  cameraReady: boolean;
  questionLoading: boolean;
}) {
  if (questionLoading) return "Preparing your next question.";
  if (isSpeakingQuestion) return "Question audio is playing.";
  if (isListening) return "Listening and transcribing your answer.";
  if (cameraEnabled && cameraReady) return "Camera ready for delivery analysis.";
  return "Ready when you are.";
}

function getPrimaryButtonLabel({
  isSpeakingQuestion,
  isListening,
  questionAudioLoading,
  questionAudioReady,
  guidedAnswerRunning,
  speakerEnabled,
}: {
  isSpeakingQuestion: boolean;
  isListening: boolean;
  questionAudioLoading: boolean;
  questionAudioReady: boolean;
  guidedAnswerRunning: boolean;
  speakerEnabled: boolean;
}) {
  if (isSpeakingQuestion) return "Question playing...";
  if (isListening) return "Recording...";
  if (questionAudioLoading && !questionAudioReady) return "Preparing audio...";
  if (guidedAnswerRunning) return "Starting...";
  if (speakerEnabled) return "Play Question + Record";
  return "Start Answer";
}

export function PracticeCoachPanel({
  speakerEnabled,
  isSpeakingQuestion,
  manualDeviceMode,
  isListening,
  cameraEnabled,
  cameraRequiresTap,
  cameraError,
  cameraReady,
  startCameraFromTap,
  videoRef,
  questionLoading,
  question,
  currentQuestionNumber,
  totalQuestions,
  speakerSupported,
  questionAudioLoading,
  questionAudioReady,
  guidedAnswerRunning,
  startGuidedAnswer,
  playQuestionManually,
  stopQuestionSpeech,
}: PracticeCoachPanelProps) {
  const primaryDisabled =
    questionLoading ||
    !question ||
    isSpeakingQuestion ||
    isListening ||
    (questionAudioLoading && !questionAudioReady);

  const coachStatus = getCoachStatus({
    isSpeakingQuestion,
    isListening,
    cameraEnabled,
    cameraReady,
    questionLoading,
  });

  const primaryButtonLabel = getPrimaryButtonLabel({
    isSpeakingQuestion,
    isListening,
    questionAudioLoading,
    questionAudioReady,
    guidedAnswerRunning,
    speakerEnabled,
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
        <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_190px]">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-3 rounded-[1.6rem] bg-cyan-400/10 blur-2xl" />
                  <div className="relative rounded-[1.4rem] border border-white/15 bg-white p-2 shadow-xl shadow-black/20">
                    <img
                      src="/brand/logo.jpg"
                      alt="AI Career Mentor"
                      className="h-16 w-16 rounded-[1rem] object-contain sm:h-20 sm:w-20"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      AI Career Coach
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-black text-gray-300">
                      Q{currentQuestionNumber}/{totalQuestions}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-[2rem]">
                    Stay calm. Answer clearly.
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    {coachStatus}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {speakerEnabled && (
                  <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs font-black text-purple-100">
                    Natural audio
                  </span>
                )}

                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                  {manualDeviceMode ? "Phone / tablet" : "Desktop"}
                </span>

                {cameraEnabled && (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                    {cameraReady ? "Camera ready" : "Camera on"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startGuidedAnswer}
                disabled={primaryDisabled}
                className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {primaryButtonLabel}
              </button>

              {!isSpeakingQuestion && (speakerSupported || manualDeviceMode) && (
                <button
                  type="button"
                  onClick={playQuestionManually}
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
                  onClick={stopQuestionSpeech}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                >
                  Stop audio
                </button>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                  Current Question
                </p>

                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-black text-gray-300">
                  {questionLoading ? "Loading" : `Question ${currentQuestionNumber}`}
                </span>
              </div>

              <p className="text-lg font-bold leading-8 text-white">
                {questionLoading ? "Generating question..." : question}
              </p>
            </div>

            {cameraError && (
              <div className="rounded-[1.35rem] border border-amber-300/15 bg-amber-300/10 p-4">
                <p className="text-xs leading-5 text-amber-100">{cameraError}</p>
                {!cameraReady && (
                  <button
                    type="button"
                    onClick={startCameraFromTap}
                    className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-amber-100"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className="xl:pl-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-black/35 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    Camera
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-gray-500">
                    Preview
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-gray-300">
                  {cameraEnabled
                    ? cameraRequiresTap
                      ? "Tap"
                      : cameraReady
                        ? "Ready"
                        : "Starting"
                    : "Off"}
                </span>
              </div>

              <div className="relative mx-auto h-[160px] w-[160px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-black shadow-xl shadow-black/20">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />

                {cameraEnabled && cameraRequiresTap && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-3 text-center">
                    <p className="text-[11px] leading-4 text-gray-300">
                      Tap to start
                    </p>

                    <button
                      type="button"
                      onClick={startCameraFromTap}
                      className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-black transition hover:bg-purple-100"
                    >
                      Start
                    </button>
                  </div>
                )}

                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <p className="text-[11px] font-bold text-gray-400">
                      Camera off
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}