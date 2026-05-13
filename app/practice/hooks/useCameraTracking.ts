"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FaceLandmarkerInstance,
  FaceTrackerModule,
  VideoMetrics,
} from "../types";
import {
  addNoFaceVideoFrame,
  analyseFaceFrame,
  calculateVideoMetrics,
  createEmptyVideoFrameStore,
} from "../lib/videoMetrics";

export function useCameraTracking({
  cameraEnabled,
  interviewStarted,
  requiresManualCameraStart,
  cameraUserStarted,
  isTablet = false,
}: {
  cameraEnabled: boolean;
  interviewStarted: boolean;
  requiresManualCameraStart: boolean;
  cameraUserStarted: boolean;
  isTablet?: boolean;
}) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const cameraLoopRef = useRef<number | null>(null);
  const cameraStartInFlightRef = useRef(false);
  const cameraAnalysisDisabledRef = useRef(false);
  const cameraFrameErrorCountRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const mediaPipeTimestampRef = useRef(0);
  const videoFramesRef = useRef(createEmptyVideoFrameStore());

  const resetVideoFrames = useCallback(() => {
    videoFramesRef.current = createEmptyVideoFrameStore();
    lastVideoTimeRef.current = -1;
    mediaPipeTimestampRef.current = 0;
    cameraFrameErrorCountRef.current = 0;
  }, []);

  const stopCameraLoop = useCallback(() => {
    if (cameraLoopRef.current) {
      window.cancelAnimationFrame(cameraLoopRef.current);
      cameraLoopRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopCameraLoop();

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    faceLandmarkerRef.current = null;
    cameraStartInFlightRef.current = false;
    cameraAnalysisDisabledRef.current = false;
    cameraFrameErrorCountRef.current = 0;
    mediaPipeTimestampRef.current = 0;
    lastVideoTimeRef.current = -1;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setCameraError("");
    resetVideoFrames();
  }, [resetVideoFrames, stopCameraLoop]);

  const waitForVideoReady = useCallback(async (video: HTMLVideoElement) => {
    if (video.readyState >= 2) return;

    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("loadedmetadata", done);
        video.removeEventListener("canplay", done);
        resolve();
      };

      video.addEventListener("loadedmetadata", done);
      video.addEventListener("canplay", done);
    });
  }, []);

  const initialiseFaceTracker = useCallback(async () => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;

    const visionModule = (await import(
      "@mediapipe/tasks-vision"
    )) as FaceTrackerModule;

    const vision = await visionModule.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    const landmarker = await visionModule.FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );

    faceLandmarkerRef.current = landmarker;
    return landmarker;
  }, []);

  const startCameraLoop = useCallback(() => {
    const loop = () => {
      const videoElement = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (
        cameraAnalysisDisabledRef.current ||
        !cameraEnabled ||
        !interviewStarted ||
        !videoElement ||
        !landmarker ||
        videoElement.readyState < 2
      ) {
        if (!cameraAnalysisDisabledRef.current) {
          cameraLoopRef.current = window.requestAnimationFrame(loop);
        }
        return;
      }

      try {
        const currentVideoTime = videoElement.currentTime;

        if (currentVideoTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentVideoTime;

          const rawTimestamp =
            typeof performance !== "undefined"
              ? Math.round(performance.now())
              : Date.now();

          const safeTimestamp = Math.max(
            rawTimestamp,
            mediaPipeTimestampRef.current + 1
          );

          mediaPipeTimestampRef.current = safeTimestamp;

          const result = landmarker.detectForVideo(videoElement, safeTimestamp);

          cameraFrameErrorCountRef.current = 0;

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            analyseFaceFrame(
              videoFramesRef.current,
              result.faceLandmarks[0],
              result.faceBlendshapes?.[0]?.categories
            );
          } else {
            addNoFaceVideoFrame(videoFramesRef.current);
          }
        }
      } catch {
        cameraFrameErrorCountRef.current += 1;

        if (cameraFrameErrorCountRef.current >= 8) {
          cameraAnalysisDisabledRef.current = true;
          stopCameraLoop();
          setCameraError(
            "Camera preview is running. Advanced live video tracking is unavailable on this browser/device, so video delivery will use a neutral fallback score."
          );
          return;
        }

        cameraLoopRef.current = window.requestAnimationFrame(loop);
        return;
      }

      cameraLoopRef.current = window.requestAnimationFrame(loop);
    };

    stopCameraLoop();
    cameraLoopRef.current = window.requestAnimationFrame(loop);
  }, [cameraEnabled, interviewStarted, stopCameraLoop]);

  const startCamera = useCallback(async () => {
    if (!cameraEnabled || !interviewStarted) return;
    if (cameraStartInFlightRef.current) return;

    try {
      cameraStartInFlightRef.current = true;
      setCameraError("");

      if (!cameraStreamRef.current) {
        // Tablets/phones: request by aspect ratio only — letting the device
        // choose its native resolution avoids iOS applying digital zoom to
        // reach a fixed pixel count from a different sensor crop.
        // Desktop: keep the explicit 640×480 that face-tracking is tuned for.
        const videoConstraints: MediaTrackConstraints = isTablet
          ? { facingMode: "user", aspectRatio: { ideal: 4 / 3 } }
          : { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } };

        cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        await waitForVideoReady(videoRef.current);
        await videoRef.current.play().catch(() => undefined);
      }

      try {
        await initialiseFaceTracker();
      } catch {
        cameraAnalysisDisabledRef.current = true;
        setCameraError(
          "Camera preview is running. Advanced live video tracking could not start on this browser/device, so video delivery will use a neutral fallback score."
        );
      }

      resetVideoFrames();
      setCameraReady(true);

      if (!cameraAnalysisDisabledRef.current) {
        startCameraLoop();
      }
    } catch {
      setCameraReady(false);
      setCameraError("Unable to access camera. Check browser permissions.");
    } finally {
      cameraStartInFlightRef.current = false;
    }
  }, [
    cameraEnabled,
    initialiseFaceTracker,
    interviewStarted,
    resetVideoFrames,
    startCameraLoop,
    waitForVideoReady,
  ]);

  const calculateCurrentVideoMetrics = useCallback((): VideoMetrics => {
    return calculateVideoMetrics(videoFramesRef.current);
  }, []);

  const cameraAnalysisDisabled = useCallback(() => {
    return cameraAnalysisDisabledRef.current;
  }, []);

  useEffect(() => {
    const cameraShouldRun =
      cameraEnabled &&
      interviewStarted &&
      (!requiresManualCameraStart || cameraUserStarted);

    if (cameraShouldRun) {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [
    cameraEnabled,
    cameraUserStarted,
    interviewStarted,
    requiresManualCameraStart,
    startCamera,
    stopCamera,
  ]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraReady,
    cameraError,
    setCameraError,
    startCamera,
    stopCamera,
    resetVideoFrames,
    calculateCurrentVideoMetrics,
    cameraAnalysisDisabled,
  };
}
