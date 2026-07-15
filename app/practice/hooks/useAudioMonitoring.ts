"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioMetrics } from "../types";
import {
  calculateAudioMetrics,
  calculateScaledVolumeSample,
} from "../lib/audioMetrics";
import { getStoredAudioInput, setStoredAudioInput } from "../lib/audioDevices";

const BASE_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/** Constraints honouring the user's saved microphone choice (if any). */
function buildAudioConstraints(deviceId: string): MediaStreamConstraints {
  return {
    audio: deviceId
      ? { ...BASE_AUDIO_CONSTRAINTS, deviceId: { exact: deviceId } }
      : BASE_AUDIO_CONSTRAINTS,
  };
}

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

  /**
   * Set on unmount. Guards getOrCreateAudioStream so late callbacks (a
   * question-audio "ended" event, an in-flight getUserMedia) can never
   * acquire a fresh microphone stream after the cleanup has already run.
   */
  const disposedRef = useRef(false);

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
    if (disposedRef.current) {
      throw new Error("Audio monitoring has been shut down.");
    }

    if (hasLiveAudioStream() && audioStreamRef.current) {
      return audioStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    const preferredDevice = getStoredAudioInput();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        buildAudioConstraints(preferredDevice)
      );
    } catch (err) {
      // The chosen microphone may have been unplugged since it was saved —
      // clear the stale preference and fall back to the system default
      // rather than failing the whole recording.
      if (!preferredDevice) throw err;
      setStoredAudioInput("");
      stream = await navigator.mediaDevices.getUserMedia(
        buildAudioConstraints("")
      );
    }
    // The component may have unmounted while getUserMedia was pending (exit
    // mid-acquisition) — the unmount cleanup has already run, so a stream
    // stored now would hold the microphone forever. Stop it immediately.
    if (disposedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("Audio monitoring has been shut down.");
    }
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
      disposedRef.current = true;
      cleanupAudioMonitoring();
    };
  }, [cleanupAudioMonitoring]);

  /** Total number of MediaRecorder chunks collected so far. */
  const getAudioChunkCount = useCallback((): number => {
    return audioChunksRef.current.length;
  }, []);

  /**
   * Returns a Blob of audio chunks starting from `fromIndex` up to the most
   * recent chunk, or null if there are no new chunks.  Used for incremental
   * Whisper polling during recording.
   */
  const getAudioChunksSince = useCallback(
    (fromIndex: number): Blob | null => {
      const chunks = audioChunksRef.current.slice(fromIndex);
      if (chunks.length === 0) return null;
      return new Blob(chunks, {
        type: recordingMimeTypeRef.current || "audio/webm",
      });
    },
    []
  );

  return {
    audioSamplesRef,
    primeAudioInput,
    startAudioMonitoring,
    cleanupAudioMonitoring,
    clearAudioSamples,
    clearAudioRecording,
    getRecordedAudioBlob,
    getAudioChunkCount,
    getAudioChunksSince,
    calculateCurrentAudioMetrics,
  };
}
