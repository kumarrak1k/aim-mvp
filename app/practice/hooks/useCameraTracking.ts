"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearMediaGranted, markMediaGranted } from "../lib/audioDevices";
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
  /**
   * Set on unmount. Guards startCamera so an exit while getUserMedia is
   * still pending can't store a stream after stopCamera has already run —
   * that stream would hold the camera (and its light) on forever.
   */
  const disposedRef = useRef(false);
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

  /**
   * Put the live stream into whichever <video> is on screen.
   *
   * This used to happen inside startCamera, which meant it only worked if the
   * element already existed when the camera opened. In a one-way video
   * interview the stage renders a moment AFTER the camera is asked to start,
   * so the stream was live (camera light on) and the candidate saw a black
   * box. Attaching is now idempotent and can be re-run whenever an element
   * appears.
   */
  const attachStreamToVideo = useCallback(async () => {
    const element = videoRef.current;
    const stream = cameraStreamRef.current;
    if (!element || !stream || element.srcObject === stream) return;

    element.srcObject = stream;
    await waitForVideoReady(element);
    await element.play().catch(() => undefined);
  }, [waitForVideoReady]);

  /**
   * Ref callback for the <video> element. Components use this instead of the
   * raw ref so a late-mounting preview attaches itself rather than waiting for
   * a camera restart that never comes.
   */
  const setVideoElement = useCallback(
    (element: HTMLVideoElement | null) => {
      videoRef.current = element;
      if (element) void attachStreamToVideo();
    },
    [attachStreamToVideo]
  );

  const startCamera = useCallback(async () => {
    if (!cameraEnabled || !interviewStarted) return;
    if (cameraStartInFlightRef.current || disposedRef.current) return;

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

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        // Unmounted while getUserMedia was pending — stopCamera has already
        // run, so storing the stream now would leak the camera. Stop it.
        if (disposedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
      }

      await attachStreamToVideo();

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
      // Remember the grant so later sessions auto-start Zoom-style instead
      // of waiting for a manual tap.
      markMediaGranted();

      if (!cameraAnalysisDisabledRef.current) {
        startCameraLoop();
      }
    } catch (err) {
      setCameraReady(false);
      const errName = err instanceof DOMException ? err.name : "";
      if (errName === "NotReadableError" || errName === "TrackStartError" || errName === "AbortError") {
        // The camera hardware is held by another app or browser (Windows
        // allows one at a time). Permission itself is fine, so keep the
        // auto-start memory for next time.
        setCameraError(
          "Your camera is in use by another app or browser window (a video call, or this site open in a different browser). Close it there, then press Try again."
        );
      } else if (errName === "NotFoundError" || errName === "OverconstrainedError") {
        setCameraError("No camera was found on this device. Plug one in or enable it, then press Try again.");
      } else {
        // Permission refused or revoked — forget the auto-start memory so the
        // next session goes back to the explicit tap + browser prompt.
        clearMediaGranted();
        setCameraError(
          "Camera access is blocked. Allow camera access for this site in your browser settings, then press Try again."
        );
      }
    } finally {
      cameraStartInFlightRef.current = false;
    }
  }, [
    attachStreamToVideo,
    cameraEnabled,
    initialiseFaceTracker,
    interviewStarted,
    resetVideoFrames,
    startCameraLoop,
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
    // Cleared on every mount, not just the first. React's development
    // double-invoke runs the cleanup below between the two mounts, and the ref
    // survives it — so without this reset the flag stayed true and every later
    // startCamera bailed out, leaving a permanently black preview in dev.
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    setVideoElement,
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
