"use client";

import type { Ref } from "react";
import { formatClock, isFinalWarning, type VideoStageState } from "../oneWayVideo";

type OneWayVideoStageProps = {
  question: string;
  questionLoading: boolean;
  currentQuestionNumber: number;
  totalQuestions: number;
  stage: VideoStageState;
  /** How many retakes are left on this question, already capped by the format. */
  retakesLeft: number;
  videoRef: Ref<HTMLVideoElement>;
  cameraReady: boolean;
  cameraError: string;
  /** True when the browser wants a tap before it will open the camera (iOS). */
  cameraRequiresTap: boolean;
  /** True while the answer is being transcribed and scored. */
  processing: boolean;
  /** True once this answer has been scored, so the only move left is onwards. */
  answerScored: boolean;
  /** True when the recording captured nothing at all. */
  answerMissing: boolean;
  /** True while the question is being read aloud, which holds the countdown. */
  questionBeingRead: boolean;
  onStartCameraFromTap: () => void;
  onReadyNow: () => void;
  onSubmitNow: () => void;
  onRetake: () => void;
  onContinue: () => void;
  /** Swap to the coaching flow from the next question. */
  onSwitchToCoaching: () => void;
  /** True once that switch is waiting for the next question. */
  switchToCoachingPending: boolean;
  onExit: () => void;
};

/**
 * A one-way video interview, the format most first-round interviews now use:
 * the question, time to think, then a recording with a timer and no transcript.
 *
 * The transcript is deliberately absent. Watching words appear turns this into
 * a proofreading exercise, and the real thing gives you nothing to read. The
 * answer is still transcribed and scored behind the scenes.
 */
export function OneWayVideoStage({
  question,
  questionLoading,
  currentQuestionNumber,
  totalQuestions,
  stage,
  retakesLeft,
  videoRef,
  cameraReady,
  cameraError,
  cameraRequiresTap,
  processing,
  answerScored,
  answerMissing,
  questionBeingRead,
  onStartCameraFromTap,
  onReadyNow,
  onSubmitNow,
  onRetake,
  onContinue,
  onSwitchToCoaching,
  switchToCoachingPending,
  onExit,
}: OneWayVideoStageProps) {
  const preparing = stage.phase === "preparing";
  const recording = stage.phase === "recording";
  const warning = isFinalWarning(stage);

  return (
    <section
      data-testid="one-way-video-stage"
      className="rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold tracking-wide text-cyan-300">
            One-way video interview
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Question {currentQuestionNumber} of {totalQuestions}
          </p>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-gray-200 transition hover:bg-white/[0.1]"
        >
          Leave interview
        </button>
      </div>

      <p className="mb-4 text-lg font-bold leading-7 tracking-tight text-white sm:text-xl">
        {questionLoading ? "Preparing your next question..." : question}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* The camera is the stage, not a thumbnail: this is what the employer
            will watch, so it is what the candidate should be looking at. */}
        <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-black shadow-xl shadow-black/30 sm:aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />

          {recording && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
              <span className="text-xs font-bold tracking-wide text-slate-50">Recording</span>
            </div>
          )}

          {/* On a phone the side panel sits below the fold while the candidate is
              looking at themselves, so the clock rides on the video instead. */}
          {(preparing || recording) && (
            <div
              className={`absolute right-3 top-3 rounded-full px-3 py-1.5 font-mono text-sm font-bold tabular-nums lg:hidden ${
                warning ? "bg-amber-300 text-slate-900" : "bg-black/70 text-slate-50"
              }`}
            >
              {formatClock(stage.secondsLeft)}
            </div>
          )}

          {/* Preparing is a strip, not a curtain: this is when the candidate
              frames the shot, so they have to be able to see themselves. */}
          {preparing && !processing && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-center">
              <p className="text-sm font-bold text-slate-50">
                {questionBeingRead
                  ? "Reading the question"
                  : "Recording starts automatically"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-300">
                {questionBeingRead
                  ? "Your preparation time starts when the question finishes."
                  : cameraReady
                    ? "Read the question and plan your answer. Nothing is being recorded yet."
                    : "Starting your camera. Read the question and plan your answer."}
              </p>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center">
              <p className="text-sm font-bold text-slate-50">Saving your answer</p>
              <p className="max-w-xs text-xs leading-5 text-gray-300">
                Hold on while your answer is transcribed and scored.
              </p>
            </div>
          )}

          {cameraRequiresTap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-4 text-center">
              <p className="text-sm leading-5 text-gray-200">
                Your browser needs a tap before it will open the camera.
              </p>
              <button
                type="button"
                onClick={onStartCameraFromTap}
                className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-purple-100"
              >
                Start camera
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={`rounded-[1.35rem] border p-4 text-center ${
              warning
                ? "border-amber-300/30 bg-amber-300/10"
                : "border-white/10 bg-recess-25"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {preparing
                ? questionBeingRead
                  ? "Listen to the question"
                  : "Time to prepare"
                : recording
                  ? "Time left"
                  : "Answer recorded"}
            </p>
            <p
              data-testid="video-clock"
              aria-live={warning ? "polite" : "off"}
              className={`mt-1 font-mono text-4xl font-bold tabular-nums ${
                warning ? "text-amber-200" : "text-white"
              }`}
            >
              {formatClock(stage.secondsLeft)}
            </p>
            {warning && (
              <p className="mt-1 text-xs font-semibold leading-5 text-amber-100">
                Bring your answer to a close.
              </p>
            )}
          </div>

          {preparing && (
            <button
              type="button"
              onClick={onReadyNow}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-on-accent shadow-xl shadow-purple-950/30 transition hover:scale-[1.01]"
            >
              I&apos;m ready, start recording
            </button>
          )}

          {recording && (
            <button
              type="button"
              onClick={onSubmitNow}
              // Never disabled: whatever the camera is doing, finishing the
              // answer is the candidate's decision to make.
              className="w-full rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
            >
              Finish this answer
            </button>
          )}

          {stage.phase === "submitting" && !processing && answerMissing && (
            <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/10 p-4">
              <p className="text-sm font-bold text-amber-100">We did not catch that</p>
              <p className="mt-1 text-xs leading-5 text-amber-50/90">
                Nothing came through on the microphone, so there is no answer to
                score. This does not count as one of your retakes.
              </p>
              <button
                type="button"
                onClick={onRetake}
                data-testid="video-record-again"
                className="mt-3 w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-background transition hover:bg-amber-100"
              >
                Record this answer again
              </button>
            </div>
          )}

          {stage.phase === "submitting" && !processing && !answerMissing && (
            <>
              {!answerScored && retakesLeft > 0 && (
                <button
                  type="button"
                  onClick={onRetake}
                  data-testid="video-retake"
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  Record it again ({retakesLeft} left)
                </button>
              )}
              <button
                type="button"
                onClick={onContinue}
                data-testid="video-continue"
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-on-accent shadow-xl shadow-purple-950/30 transition hover:scale-[1.01]"
              >
                {!answerScored
                  ? "Use this answer"
                  : currentQuestionNumber >= totalQuestions
                    ? "Finish interview"
                    : "Next question"}
              </button>
            </>
          )}

          <p className="text-xs leading-5 text-gray-400">
            There is no transcript on screen, the same as the real thing. Your
            answer is still transcribed and scored, and you will see it in your
            report.
          </p>

          <button
            type="button"
            onClick={onSwitchToCoaching}
            disabled={switchToCoachingPending}
            data-testid="switch-to-coaching"
            className="text-left text-xs font-bold text-gray-400 underline underline-offset-4 transition hover:text-gray-300 disabled:no-underline disabled:opacity-70"
          >
            {switchToCoachingPending
              ? "Coaching format from the next question"
              : "Switch to the coaching format"}
          </button>

          {cameraError && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
              <p className="text-xs leading-5 text-amber-100">{cameraError}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
