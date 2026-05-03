"use client";

import type { RefObject } from "react";
import { GlassCard } from "./PracticeUi";

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

export function PracticeCoachPanel({
  role,
  interviewType,
  difficulty,
  focusArea,
  speakerEnabled,
  isSpeakingQuestion,
  manualDeviceMode,
  isListening,
  questionAudioMessage,
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
  return (
    <GlassCard>
      <div className="mb-5 rounded-[1.5rem] border border-purple-300/15 bg-purple-300/10 p-4">
        <div className="grid gap-2 text-xs font-bold text-gray-300 sm:grid-cols-2">
          <p>
            <span className="text-gray-500">Role:</span> {role || "Not set"}
          </p>
          <p>
            <span className="text-gray-500">Type:</span> {interviewType}
          </p>
          <p>
            <span className="text-gray-500">Difficulty:</span> {difficulty}
          </p>
          <p>
            <span className="text-gray-500">Focus:</span> {focusArea}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/30 p-5">
        <div className="grid gap-5 lg:grid-cols-[auto_1fr_260px] lg:items-center">
          <div className="relative mx-auto flex h-34 w-34 items-center justify-center rounded-[2rem] bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 p-2 shadow-2xl shadow-purple-950/40 lg:mx-0">
            <div
              className={`absolute inset-0 rounded-[2rem] ${
                isSpeakingQuestion ? "animate-ping bg-purple-400/30" : ""
              }`}
            />
            <div className="relative rounded-[1.5rem] bg-white p-2 shadow-xl shadow-black/20">
              <img
                src="/brand/logo.jpg"
                alt="AI Career Coach"
                className="h-24 w-24 rounded-[1.1rem] object-contain"
              />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black leading-tight tracking-[-0.04em] text-white">
              AI Career Coach
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
              {speakerEnabled
                ? isSpeakingQuestion
                  ? "Reading the question aloud."
                  : manualDeviceMode
                  ? "Phone/tablet mode is active. Use the large Guided Answer button to hear the question and start recording."
                  : isListening
                  ? "Listening now. Keep speaking naturally and finish your answer before requesting feedback."
                  : "Ready to guide your mock interview."
                : "Read the question, answer naturally, then request strict hiring-bar feedback."}
            </p>

            {questionAudioMessage && (
              <p className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-100">
                {questionAudioMessage}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                {speakerEnabled ? "Speaker enabled" : "Text mode"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                {cameraEnabled ? "Camera enabled" : "Camera off"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                {manualDeviceMode ? "Phone/tablet safe mode" : "Desktop mode"}
              </span>
              {manualDeviceMode && (
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                  {questionAudioReady ? "AI audio ready" : "Preparing AI audio"}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-black/45 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Camera
              </p>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-gray-300">
                {cameraEnabled
                  ? cameraRequiresTap
                    ? "Tap to start"
                    : cameraError
                    ? "Preview"
                    : cameraReady
                    ? "Ready"
                    : "Starting"
                  : "Off"}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-36 w-full object-cover"
              />

              {cameraRequiresTap && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-4 text-center">
                  <p className="text-xs leading-5 text-gray-300">
                    Camera is ready but needs a tap on this device.
                  </p>
                  <button
                    type="button"
                    onClick={startCameraFromTap}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-purple-100"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-4 text-gray-500">
              {cameraEnabled
                ? cameraRequiresTap
                  ? "Tap Start Camera, or use Guided Answer to start it."
                  : cameraError
                  ? "Preview active. Scoring uses fallback if tracking is unavailable."
                  : "Tracking eye contact, posture and presence."
                : "Camera analysis off."}
            </p>
          </div>
        </div>

        {cameraError && (
          <p className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
            {cameraError}
          </p>
        )}
      </div>

      <div className="rounded-[1.6rem] border border-purple-300/20 bg-purple-300/10 p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
            Current Question
          </p>
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-black text-gray-300">
            {currentQuestionNumber}/{totalQuestions}
          </span>
        </div>
        <p className="text-lg font-bold leading-8 text-white">
          {questionLoading ? "Generating question..." : question}
        </p>

        {manualDeviceMode && question && (
          <button
            type="button"
            onClick={startGuidedAnswer}
            disabled={
              questionLoading ||
              isSpeakingQuestion ||
              isListening ||
              (questionAudioLoading && !questionAudioReady)
            }
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSpeakingQuestion
              ? "Question Playing..."
              : isListening
              ? "Recording..."
              : questionAudioLoading && !questionAudioReady
              ? "Preparing Audio..."
              : guidedAnswerRunning
              ? "Starting Guided Answer..."
              : "Guided Answer: Play Question + Record"}
          </button>
        )}

        {question && (speakerSupported || manualDeviceMode) && (
          <button
            type="button"
            onClick={() => {
              if (isSpeakingQuestion) {
                stopQuestionSpeech();
              } else {
                playQuestionManually();
              }
            }}
            disabled={questionAudioLoading && !questionAudioReady}
            className="mt-3 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
          >
            {isSpeakingQuestion
              ? "Stop Question Audio"
              : questionAudioLoading && !questionAudioReady
              ? "Preparing Audio..."
              : "Play Question Only"}
          </button>
        )}
      </div>
    </GlassCard>
  );
}
