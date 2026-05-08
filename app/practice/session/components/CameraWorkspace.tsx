"use client";

import type { RefObject } from "react";

type CameraWorkspaceProps = {
  cameraEnabled: boolean;
  cameraReady: boolean;
  cameraError: string;
  cameraRequiresTap: boolean;
  feedbackReady: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onStartCameraFromTap: () => void;
  onViewFeedback: () => void;
  /** Reword the "View feedback" call-to-action when the candidate is taking
   *  a company assessment (no feedback to view; just continue to the next
   *  question). */
  assessmentMode?: boolean;
};

export function CameraWorkspace({
  cameraEnabled,
  cameraReady,
  cameraError,
  cameraRequiresTap,
  feedbackReady,
  videoRef,
  onStartCameraFromTap,
  onViewFeedback,
  assessmentMode = false,
}: CameraWorkspaceProps) {
  const statusLabel = cameraEnabled
    ? cameraRequiresTap
      ? "Tap"
      : cameraReady
        ? "Ready"
        : "Starting"
    : "Off";

  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            Camera
          </p>
          <p className="mt-0.5 text-[10px] text-gray-500">Live preview</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-black text-gray-300">
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] xl:block">
        <div className="relative mx-auto h-[260px] w-full max-w-[240px] overflow-hidden rounded-[1.15rem] border border-white/10 bg-black shadow-xl shadow-black/20 sm:h-[220px] sm:max-w-none xl:h-[132px]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />

          {cameraEnabled && cameraRequiresTap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-3 text-center">
              <p className="text-[11px] leading-4 text-gray-300">
                Tap to start camera
              </p>
              <button
                type="button"
                onClick={onStartCameraFromTap}
                className="rounded-full bg-white px-4 py-2 text-[11px] font-black text-black transition hover:bg-purple-100"
              >
                Start
              </button>
            </div>
          )}

          {!cameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p className="text-[11px] font-bold text-gray-400">Camera off</p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {feedbackReady ? (
            <div className="rounded-[1rem] border border-emerald-300/20 bg-emerald-300/10 p-3 xl:mt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                {assessmentMode ? "Answer recorded" : "Feedback ready"}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-gray-300">
                {assessmentMode
                  ? "Continue to the next question below."
                  : "Your AI coaching notes are ready below."}
              </p>
              <button
                type="button"
                onClick={onViewFeedback}
                className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-[11px] font-black text-black transition hover:bg-emerald-100"
              >
                {assessmentMode ? "Continue" : "View feedback"}
              </button>
            </div>
          ) : (
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3 xl:hidden">
              <p className="text-[11px] font-black text-white">
                Camera presence
              </p>
              <p className="mt-1 text-[11px] leading-4 text-gray-500">
                Hold the phone at eye level and keep your face centred in the
                portrait preview.
              </p>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-2 text-[10px] leading-4 text-amber-100">
              {cameraError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}