"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioMetrics } from "../types";
import {
  calculateAudioMetrics,
  calculateScaledVolumeSample,
} from "../lib/audioMetrics";

export function useAudioMonitoring() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const audioSamplesRef = useRef<number[]>([]);

  const cleanupAudioMonitoring = useCallback(() => {
    if (audioIntervalRef.current) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

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

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  }, []);

  const clearAudioSamples = useCallback(() => {
    audioSamplesRef.current = [];
  }, []);

  const startAudioMonitoring = useCallback(async () => {
    cleanupAudioMonitoring();
    audioSamplesRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;

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
  }, [cleanupAudioMonitoring]);

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
    startAudioMonitoring,
    cleanupAudioMonitoring,
    clearAudioSamples,
    calculateCurrentAudioMetrics,
  };
}
