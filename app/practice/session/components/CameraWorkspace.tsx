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
      <div className="grid gap-3 sm:grid-cols-[118px_minmax(0,1fr)] xl:block">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 xl:mb-2">
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

          <div className="relative mx-auto aspect-square w-full max-w-[118px] overflow-hidden rounded-[1rem] border border-white/10 bg-black shadow-xl shadow-black/20 sm:max-w-none xl:max-h-[132px]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />

            {cameraEnabled && cameraRequiresTap && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-3 text-center">
                <p className="text-[10px] leading-4 text-gray-300">
                  Tap to start
                </p>
                <button
                  type="button"
                  onClick={onStartCameraFromTap}
                  className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-black transition hover:bg-purple-100"
                >
                  Start
                </button>
              </div>
            )}

            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <p className="text-[10px] font-bold text-gray-400">Camera off</p>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {feedbackReady ? (
            <div className="rounded-[1rem] border border-emerald-300/20 bg-emerald-300/10 p-3 xl:mt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                Feedback ready
              </p>
              <p className="mt-1 text-[11px] leading-4 text-gray-300">
                Your AI coaching notes are ready below.
              </p>
              <button
                type="button"
                onClick={onViewFeedback}
                className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-[11px] font-black text-black transition hover:bg-emerald-100"
              >
                View feedback
              </button>
            </div>
          ) : (
            <div className="hidden h-full rounded-[1rem] border border-white/10 bg-black/20 p-3 sm:block xl:hidden">
              <p className="text-[11px] font-black text-white">
                Camera presence
              </p>
              <p className="mt-1 text-[11px] leading-4 text-gray-500">
                Kept compact on mobile/tablet so the question and transcript stay
                readable.
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