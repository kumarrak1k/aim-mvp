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
  const isAudioPreparing = questionAudioLoading && !questionAudioReady;
  const coachStatus = isSpeakingQuestion
    ? "Playing question"
    : isListening
    ? "Recording answer"
    : isAudioPreparing
    ? "Preparing audio"
    : questionAudioReady
    ? "Audio ready"
    : "Ready";

  const guidedButtonLabel = isSpeakingQuestion
    ? "Question playing..."
    : isListening
    ? "Recording..."
    : isAudioPreparing
    ? "Preparing audio..."
    : guidedAnswerRunning
    ? "Starting..."
    : "Guided Answer";

  return (
    <GlassCard>
      <div className="mb-5 flex flex-col gap-4 rounded-[1.7rem] border border-white/10 bg-black/25 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`absolute -inset-2 rounded-[1.5rem] blur-xl ${
                isListening || isSpeakingQuestion ? "bg-cyan-400/30" : "bg-purple-500/20"
              }`}
            />
            <div className="relative rounded-[1.3rem] border border-white/15 bg-white p-1.5 shadow-xl shadow-purple-950/30">
              <img
                src="/brand/logo.jpg"
                alt="AI Career Coach"
                className="h-14 w-14 rounded-2xl object-contain sm:h-16 sm:w-16"
              />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              AI Career Coach
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
              {isListening
                ? "Recording your answer"
                : isSpeakingQuestion
                ? "Playing the question"
                : "Ready for question practice"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Question {currentQuestionNumber} of {totalQuestions} · {coachStatus}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SmallPill label="Audio" value={speakerEnabled ? "Natural" : "Off"} />
          <SmallPill label="Camera" value={cameraEnabled ? (cameraReady ? "Ready" : "On") : "Off"} />
          <SmallPill label="Mode" value={manualDeviceMode ? "Mobile" : "Desktop"} />
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
        <section className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <ContextLine label="Role" value={role || "Not set"} />
            <ContextLine label="Interview" value={interviewType} />
            <ContextLine label="Difficulty" value={difficulty} />
            <ContextLine label="Focus" value={focusArea} />
          </div>

          <div className="rounded-[1.45rem] border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Coach guidance
            </p>
            <p className="text-sm leading-7 text-gray-200">
              {isListening
                ? "Keep speaking naturally. Use context, action, result, then finish with what changed."
                : isSpeakingQuestion
                ? "Listen to the full question. Recording starts automatically after the guided question audio."
                : "If Speaker + Text is selected on desktop, the question should play automatically and then start recording."}
            </p>
          </div>

          {questionAudioMessage && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs font-semibold leading-5 text-gray-300">
              {questionAudioMessage}
            </p>
          )}
        </section>

        <section className="rounded-[1.7rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/12 via-cyan-300/10 to-blue-400/10 p-5 shadow-xl shadow-cyan-950/10">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
            Recommended flow
          </p>
          <h3 className="text-2xl font-black tracking-[-0.035em] text-white">
            Hear. Think. Answer.
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-300">
            Plays natural question audio, then starts recording your answer.
          </p>

          <button
            type="button"
            onClick={startGuidedAnswer}
            disabled={
              questionLoading ||
              !question ||
              isSpeakingQuestion ||
              isListening ||
              isAudioPreparing
            }
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 px-5 py-4 text-sm font-black text-black shadow-2xl shadow-cyan-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guidedButtonLabel}
          </button>

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
              disabled={isAudioPreparing}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSpeakingQuestion
                ? "Stop audio"
                : isAudioPreparing
                ? "Preparing audio..."
                : "Play question only"}
            </button>
          )}
        </section>
      </div>

      <section className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Camera preview
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Presence, posture and remote-interview confidence.
            </p>
          </div>

          <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-gray-300">
            {cameraEnabled
              ? cameraRequiresTap
                ? "Tap required"
                : cameraError
                ? "Preview"
                : cameraReady
                ? "Ready"
                : "Starting"
              : "Off"}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black shadow-xl shadow-black/30">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />

          {!cameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4 text-center">
              <p className="max-w-sm text-sm font-semibold leading-6 text-gray-400">
                Camera scoring is off. Enable Camera On to practise presence.
              </p>
            </div>
          )}

          {cameraRequiresTap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-4 text-center">
              <p className="text-xs leading-5 text-gray-300">
                Camera needs a tap on this device.
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

        <p className="mt-3 text-xs leading-5 text-gray-500">
          {cameraEnabled
            ? cameraRequiresTap
              ? "Tap Start Camera, or use Guided Answer to start it."
              : cameraError
              ? "Preview active. Scoring uses fallback if tracking is unavailable."
              : "Tracking eye contact, posture and presence."
            : "Camera analysis is currently off."}
        </p>

        {cameraError && (
          <p className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
            {cameraError}
          </p>
        )}
      </section>

      <section className="rounded-[1.7rem] border border-purple-300/20 bg-purple-300/10 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
              Current question
            </p>
            <p className="mt-1 text-xs font-bold text-gray-500">
              Keep the answer specific, structured and evidence-led.
            </p>
          </div>
          <span className="w-fit rounded-full bg-black/30 px-3 py-1 text-xs font-black text-gray-300">
            {currentQuestionNumber}/{totalQuestions}
          </span>
        </div>

        <p className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 text-base font-bold leading-7 text-white sm:text-lg sm:leading-8">
          {questionLoading ? "Generating question..." : question}
        </p>
      </section>
    </GlassCard>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black leading-5 text-gray-200">
        {value}
      </p>
    </div>
  );
}

function SmallPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-black text-gray-200">{value}</p>
    </div>
  );
}
