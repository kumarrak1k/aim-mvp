"use client";

import { ToggleButton } from "./PracticeUi";

type PracticeSessionHeaderProps = {
  currentQuestionNumber: number;
  totalQuestions: number;
  averageQuestionScore: number;
  question: string;
  speakerSupported: boolean;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  manualDeviceMode: boolean;
  questionAudioReady: boolean;
  questionAudioLoading: boolean;
  isSpeakingQuestion: boolean;
  setTextOnlyMode: () => void;
  setSpeakerMode: () => void;
  toggleCamera: () => void;
  playQuestionManually: () => void;
  stopQuestionSpeech: () => void;
  setQuestionAudioMessage: (message: string) => void;
};

export function PracticeSessionHeader({
  currentQuestionNumber,
  totalQuestions,
  averageQuestionScore,
  question,
  speakerSupported,
  speakerEnabled,
  cameraEnabled,
  manualDeviceMode,
  questionAudioReady,
  questionAudioLoading,
  isSpeakingQuestion,
  setTextOnlyMode,
  setSpeakerMode,
  toggleCamera,
  playQuestionManually,
  stopQuestionSpeech,
  setQuestionAudioMessage,
}: PracticeSessionHeaderProps) {
  const progressPercent = Math.round(
    ((currentQuestionNumber - 1) / Math.max(1, totalQuestions)) * 100
  );

  return (
    <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs font-bold tracking-wide text-purple-200">
                Question {currentQuestionNumber} of {totalQuestions}
              </span>

              <span className="rounded-full border border-white/10 bg-recess-25 px-3 py-1.5 text-xs font-bold text-gray-300">
                Avg score: {averageQuestionScore}/10
              </span>

              {manualDeviceMode && (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                  Phone/tablet flow
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Live interview practice
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Answer naturally, then use the AI feedback to tighten your story,
              delivery and confidence before the next question.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-recess-25 p-3 xl:min-w-[430px]">
            <div className="grid gap-2 sm:grid-cols-3">
              <ToggleButton active={!speakerEnabled} onClick={setTextOnlyMode}>
                Text Only
              </ToggleButton>

              <ToggleButton
                active={speakerEnabled}
                onClick={() => {
                  setSpeakerMode();

                  if (question && manualDeviceMode) {
                    setQuestionAudioMessage(
                      questionAudioReady
                        ? "Tap Guided Answer to hear the question and start recording."
                        : "Preparing natural question audio..."
                    );
                  }
                }}
              >
                Speaker + Text
              </ToggleButton>

              <ToggleButton active={cameraEnabled} onClick={toggleCamera}>
                {cameraEnabled ? "Camera On" : "Camera Off"}
              </ToggleButton>
            </div>

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
                disabled={questionAudioLoading}
                className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSpeakingQuestion
                  ? "Stop question audio"
                  : questionAudioLoading
                  ? "Preparing audio..."
                  : manualDeviceMode
                  ? "Play question only"
                  : "Play question"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400">
            <span>Interview progress</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-recess-35 ring-1 ring-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-300 to-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
