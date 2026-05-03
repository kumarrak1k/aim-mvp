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
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="mb-1 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
          Question {currentQuestionNumber} of {totalQuestions}
        </p>
        <h2 className="text-2xl font-black tracking-[-0.03em]">
          Interview practice session
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Average score so far: {averageQuestionScore}/10
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
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
            className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSpeakingQuestion
              ? "Stop Voice"
              : questionAudioLoading
              ? "Preparing Audio..."
              : "Play Question"}
          </button>
        )}
      </div>
    </div>
  );
}
