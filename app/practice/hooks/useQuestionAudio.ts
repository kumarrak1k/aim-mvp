"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchQuestionAudioBlob } from "../lib/interviewApi";
import type { SpeakerPreference } from "../types";

type PlayPreparedQuestionAudioOptions = {
  text: string;
  speakerPreference?: SpeakerPreference;
  startRecordingAfterPlayback?: boolean;
  fallbackToBrowserSpeech?: (text: string, autoStartListening: boolean) => void;
};

const speakerPreferenceKey = (speakerPreference?: SpeakerPreference) =>
  JSON.stringify(
    speakerPreference || {
      voice: "female",
      accent: "british",
      pace: "natural",
    }
  );

export function useQuestionAudio({
  onPlaybackStart,
  onPlaybackEnd,
  onGuidedPlaybackComplete,
  onPlaybackError,
}: {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onGuidedPlaybackComplete?: () => void;
  onPlaybackError?: (message: string) => void;
} = {}) {
  const [questionAudioLoading, setQuestionAudioLoading] = useState(false);
  const [questionAudioReady, setQuestionAudioReady] = useState(false);
  const [questionAudioError, setQuestionAudioError] = useState("");
  const [questionAudioMessage, setQuestionAudioMessage] = useState("");
  const [isPreparedQuestionPlaying, setIsPreparedQuestionPlaying] =
    useState(false);

  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionAudioUrlRef = useRef<string | null>(null);
  const questionAudioPreparingRef = useRef(false);
  const questionAudioReadyRef = useRef(false);
  const preparedQuestionTextRef = useRef("");
  const preparedSpeakerPreferenceKeyRef = useRef("");
  const startRecordingAfterPlaybackRef = useRef(false);
  const microphoneStartTimerRef = useRef<number | null>(null);

  const onPlaybackStartRef = useRef(onPlaybackStart);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const onGuidedPlaybackCompleteRef = useRef(onGuidedPlaybackComplete);
  const onPlaybackErrorRef = useRef(onPlaybackError);

  useEffect(() => {
    onPlaybackStartRef.current = onPlaybackStart;
    onPlaybackEndRef.current = onPlaybackEnd;
    onGuidedPlaybackCompleteRef.current = onGuidedPlaybackComplete;
    onPlaybackErrorRef.current = onPlaybackError;
  }, [onPlaybackStart, onPlaybackEnd, onGuidedPlaybackComplete, onPlaybackError]);

  const clearMicrophoneStartTimer = useCallback(() => {
    if (microphoneStartTimerRef.current !== null) {
      window.clearTimeout(microphoneStartTimerRef.current);
      microphoneStartTimerRef.current = null;
    }
  }, []);

  const setAudioReady = useCallback((value: boolean) => {
    questionAudioReadyRef.current = value;
    setQuestionAudioReady(value);
  }, []);

  const cleanupPreparedQuestionAudio = useCallback(() => {
    clearMicrophoneStartTimer();

    if (questionAudioRef.current) {
      try {
        questionAudioRef.current.pause();
        questionAudioRef.current.src = "";
      } catch {
        // Ignore cleanup failures.
      }
      questionAudioRef.current = null;
    }

    if (questionAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(questionAudioUrlRef.current);
      } catch {
        // Ignore cleanup failures.
      }
      questionAudioUrlRef.current = null;
    }

    questionAudioPreparingRef.current = false;
    preparedQuestionTextRef.current = "";
    preparedSpeakerPreferenceKeyRef.current = "";
    startRecordingAfterPlaybackRef.current = false;
    setQuestionAudioLoading(false);
    setAudioReady(false);
    setQuestionAudioError("");
    setIsPreparedQuestionPlaying(false);
  }, [clearMicrophoneStartTimer, setAudioReady]);

  const stopPreparedQuestionPlayback = useCallback(() => {
    clearMicrophoneStartTimer();

    if (questionAudioRef.current) {
      try {
        questionAudioRef.current.pause();
        questionAudioRef.current.currentTime = 0;
      } catch {
        // Ignore playback cleanup failures.
      }
    }

    startRecordingAfterPlaybackRef.current = false;
    setIsPreparedQuestionPlaying(false);
    setQuestionAudioLoading(false);
  }, [clearMicrophoneStartTimer]);

  const startMicrophoneAfterAudio = useCallback(() => {
    clearMicrophoneStartTimer();

    setQuestionAudioMessage("Question finished. Starting microphone...");

    microphoneStartTimerRef.current = window.setTimeout(() => {
      microphoneStartTimerRef.current = null;
      onGuidedPlaybackCompleteRef.current?.();
    }, 650);
  }, [clearMicrophoneStartTimer]);

  const prepareQuestionAudio = useCallback(
    async (text: string, speakerPreference?: SpeakerPreference) => {
      const safeText = text.trim();
      if (!safeText) return false;

      const preferenceKey = speakerPreferenceKey(speakerPreference);

      if (
        preparedQuestionTextRef.current === safeText &&
        preparedSpeakerPreferenceKeyRef.current === preferenceKey &&
        questionAudioRef.current &&
        questionAudioReadyRef.current
      ) {
        return true;
      }

      if (questionAudioPreparingRef.current) {
        return false;
      }

      cleanupPreparedQuestionAudio();
      questionAudioPreparingRef.current = true;
      setQuestionAudioLoading(true);
      setQuestionAudioError("");
      setQuestionAudioMessage("Preparing natural question audio...");

      try {
        const blob = await fetchQuestionAudioBlob(safeText, speakerPreference);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = "auto";

        audio.onplay = () => {
          setIsPreparedQuestionPlaying(true);
          setQuestionAudioMessage("Playing natural AI question audio...");
          onPlaybackStartRef.current?.();
        };

        audio.onended = () => {
          setIsPreparedQuestionPlaying(false);
          setQuestionAudioLoading(false);
          onPlaybackEndRef.current?.();

          if (startRecordingAfterPlaybackRef.current) {
            startRecordingAfterPlaybackRef.current = false;
            startMicrophoneAfterAudio();
          } else {
            setQuestionAudioMessage("Question played.");
          }
        };

        audio.onerror = () => {
          clearMicrophoneStartTimer();
          startRecordingAfterPlaybackRef.current = false;
          setIsPreparedQuestionPlaying(false);
          setQuestionAudioLoading(false);
          setAudioReady(false);

          const message = "Natural question audio could not play on this device.";
          setQuestionAudioError(message);
          setQuestionAudioMessage(
            "Natural question audio could not play. The written question is shown below."
          );
          onPlaybackErrorRef.current?.(message);
        };

        questionAudioRef.current = audio;
        questionAudioUrlRef.current = url;
        preparedQuestionTextRef.current = safeText;
        preparedSpeakerPreferenceKeyRef.current = preferenceKey;
        questionAudioPreparingRef.current = false;
        setAudioReady(true);
        setQuestionAudioLoading(false);
        setQuestionAudioMessage("Natural question audio ready.");

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Natural question audio could not be prepared.";

        clearMicrophoneStartTimer();
        questionAudioPreparingRef.current = false;
        setQuestionAudioLoading(false);
        setAudioReady(false);
        setQuestionAudioError(message);
        setQuestionAudioMessage(
          "Natural question audio is unavailable. Read the question or check OPENAI_API_KEY."
        );
        return false;
      }
    },
    [
      cleanupPreparedQuestionAudio,
      clearMicrophoneStartTimer,
      setAudioReady,
      startMicrophoneAfterAudio,
    ]
  );

  const playPreparedQuestionAudio = useCallback(
    async ({
      text,
      speakerPreference,
      startRecordingAfterPlayback = false,
      fallbackToBrowserSpeech,
    }: PlayPreparedQuestionAudioOptions) => {
      const safeText = text.trim();
      if (!safeText) return false;

      const preferenceKey = speakerPreferenceKey(speakerPreference);
      let audio = questionAudioRef.current;

      if (
        !audio ||
        preparedQuestionTextRef.current !== safeText ||
        preparedSpeakerPreferenceKeyRef.current !== preferenceKey
      ) {
        const prepared = await prepareQuestionAudio(safeText, speakerPreference);

        if (!prepared) {
          fallbackToBrowserSpeech?.(safeText, startRecordingAfterPlayback);
          return false;
        }

        audio = questionAudioRef.current;
      }

      if (!audio) return false;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      stopPreparedQuestionPlayback();
      startRecordingAfterPlaybackRef.current = startRecordingAfterPlayback;

      try {
        setQuestionAudioLoading(false);
        setQuestionAudioMessage("Playing natural AI question audio...");
        audio.currentTime = 0;
        await audio.play();
        return true;
      } catch {
        clearMicrophoneStartTimer();
        startRecordingAfterPlaybackRef.current = false;
        setIsPreparedQuestionPlaying(false);

        const message =
          "This device blocked natural audio playback. Tap Play Question again, or read the written question below.";
        setQuestionAudioMessage(message);
        onPlaybackErrorRef.current?.(message);
        fallbackToBrowserSpeech?.(safeText, startRecordingAfterPlayback);
        return false;
      }
    },
    [
      clearMicrophoneStartTimer,
      prepareQuestionAudio,
      stopPreparedQuestionPlayback,
    ]
  );

  useEffect(() => {
    return () => {
      cleanupPreparedQuestionAudio();
    };
  }, [cleanupPreparedQuestionAudio]);

  return {
    questionAudioRef,
    questionAudioLoading,
    questionAudioReady,
    questionAudioError,
    questionAudioMessage,
    isPreparedQuestionPlaying,
    setQuestionAudioMessage,
    setQuestionAudioError,
    prepareQuestionAudio,
    playPreparedQuestionAudio,
    stopPreparedQuestionPlayback,
    cleanupPreparedQuestionAudio,
  };
}