"use client";

import type { RefObject } from "react";

type CameraWorkspaceProps = {
  cameraEnabled: boolean;
  cameraReady: boolean;
  cameraError: string;
  cameraRequiresTap: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onStartCameraFromTap: () => void;
};

export function CameraWorkspace({
  cameraEnabled,
  cameraReady,
  cameraError,
  cameraRequiresTap,
  videoRef,
  onStartCameraFromTap,
}: CameraWorkspaceProps) {
  return (
    <section className="rounded-[1.65rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Camera
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Live preview</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-gray-300">
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
            <p className="text-[11px] leading-4 text-gray-300">Tap to start</p>
            <button
              type="button"
              onClick={onStartCameraFromTap}
              className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-black transition hover:bg-purple-100"
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

      {cameraError && (
        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {cameraError}
        </p>
      )}
    </section>
  );
}