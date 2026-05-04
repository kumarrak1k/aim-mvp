"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchQuestionAudioBlob } from "../lib/interviewApi";

type PlayPreparedQuestionAudioOptions = {
  text: string;
  startRecordingAfterPlayback?: boolean;
  fallbackToBrowserSpeech?: (text: string, autoStartListening: boolean) => void;
};

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
    async (text: string) => {
      const safeText = text.trim();
      if (!safeText) return false;

      if (
        preparedQuestionTextRef.current === safeText &&
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
        const blob = await fetchQuestionAudioBlob(safeText);
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
            setQuestionAudioMessage(
              "Question played. Use Guided Answer to record, Start Voice Answer, or type your response."
            );
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
            "Natural question audio could not play. The written question is shown below; browser robotic voice is disabled."
          );
          onPlaybackErrorRef.current?.(message);
        };

        questionAudioRef.current = audio;
        questionAudioUrlRef.current = url;
        preparedQuestionTextRef.current = safeText;
        questionAudioPreparingRef.current = false;
        setAudioReady(true);
        setQuestionAudioLoading(false);
        setQuestionAudioMessage(
          "Natural question audio ready. Use Guided Answer to hear it and start recording."
        );

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
          "Natural question audio is unavailable. Browser robotic voice is disabled; read the question or check OPENAI_API_KEY."
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
      startRecordingAfterPlayback = false,
    }: PlayPreparedQuestionAudioOptions) => {
      const safeText = text.trim();
      if (!safeText) return false;

      let audio = questionAudioRef.current;

      if (!audio || preparedQuestionTextRef.current !== safeText) {
        const prepared = await prepareQuestionAudio(safeText);

        if (!prepared) {
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
