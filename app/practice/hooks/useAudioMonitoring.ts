"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioMetrics } from "../types";
import {
  calculateAudioMetrics,
  calculateScaledVolumeSample,
} from "../lib/audioMetrics";

const audioConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

/** Returns the best supported MIME type for MediaRecorder audio capture. */
function getSupportedRecordingMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function useAudioMonitoring() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const audioSamplesRef = useRef<number[]>([]);

  /** MediaRecorder that runs alongside the volume analyser to capture raw audio. */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef<string>("");

  const hasLiveAudioStream = useCallback(() => {
    return Boolean(
      audioStreamRef.current?.getAudioTracks().some(
        (track) => track.readyState === "live"
      )
    );
  }, []);

  const cleanupAudioGraph = useCallback((stopStream: boolean) => {
    if (audioIntervalRef.current) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    // Stop MediaRecorder before stopping the stream.
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore cleanup failures.
      }
    }
    mediaRecorderRef.current = null;

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {
        // Ignore cleanup failures.
      }
      audioSourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore cleanup failures.
      }
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    if (stopStream && audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const cleanupAudioMonitoring = useCallback(() => {
    cleanupAudioGraph(true);
  }, [cleanupAudioGraph]);

  const getOrCreateAudioStream = useCallback(async () => {
    if (hasLiveAudioStream() && audioStreamRef.current) {
      return audioStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    audioStreamRef.current = stream;
    return stream;
  }, [hasLiveAudioStream]);

  const primeAudioInput = useCallback(async () => {
    await getOrCreateAudioStream();
    return true;
  }, [getOrCreateAudioStream]);

  const clearAudioSamples = useCallback(() => {
    audioSamplesRef.current = [];
  }, []);

  /** Discard any previously recorded audio so each answer starts fresh. */
  const clearAudioRecording = useCallback(() => {
    audioChunksRef.current = [];
    recordingMimeTypeRef.current = "";
  }, []);

  /**
   * Returns a Blob of the recorded audio for this recording session, or null
   * if recording is unsupported / nothing was captured.  Must be called BEFORE
   * cleanupAudioMonitoring() because cleanup stops the stream.
   */
  const getRecordedAudioBlob = useCallback((): Blob | null => {
    if (audioChunksRef.current.length === 0) return null;
    return new Blob(audioChunksRef.current, {
      type: recordingMimeTypeRef.current || "audio/webm",
    });
  }, []);

  const startAudioMonitoring = useCallback(async () => {
    cleanupAudioGraph(false);
    audioSamplesRef.current = [];

    const stream = await getOrCreateAudioStream();

    const AudioContextClass =
      window.AudioContext ||
      ((window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext as typeof AudioContext | undefined);

    if (!AudioContextClass) {
      throw new Error("AudioContext is not supported.");
    }

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    audioSourceRef.current = source;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    analyserRef.current = analyser;

    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    audioIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);
      audioSamplesRef.current.push(calculateScaledVolumeSample(dataArray));
    }, 100);

    // ── MediaRecorder (audio capture for Whisper filler detection) ──────────
    // Runs alongside the volume analyser on the same stream.  Chunks are
    // collected every second and assembled into a Blob via getRecordedAudioBlob().
    try {
      const mimeType = getSupportedRecordingMimeType();
      if (mimeType) {
        audioChunksRef.current = [];
        recordingMimeTypeRef.current = mimeType;
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000); // emit a chunk every second
        mediaRecorderRef.current = recorder;
      }
    } catch {
      // MediaRecorder is optional — fall back gracefully.
      mediaRecorderRef.current = null;
    }
    // ────────────────────────────────────────────────────────────────────────
  }, [cleanupAudioGraph, getOrCreateAudioStream]);

  const calculateCurrentAudioMetrics = useCallback((): AudioMetrics => {
    return calculateAudioMetrics(audioSamplesRef.current);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioMonitoring();
    };
  }, [cleanupAudioMonitoring]);

  return {
    audioSamplesRef,
    primeAudioInput,
    startAudioMonitoring,
    cleanupAudioMonitoring,
    clearAudioSamples,
    clearAudioRecording,
    getRecordedAudioBlob,
    calculateCurrentAudioMetrics,
  };
}
