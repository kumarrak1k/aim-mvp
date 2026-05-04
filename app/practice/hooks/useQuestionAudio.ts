"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeakerPreference } from "../types";

type PlayPreparedQuestionAudioOptions = {
  text: string;
  speakerPreference?: SpeakerPreference;
  startRecordingAfterPlayback?: boolean;
  fallbackToBrowserSpeech?: (text: string, autoStartListening: boolean) => void;
};

type PreparedAudioEntry = {
  audio: HTMLAudioElement;
  url: string;
  text: string;
  preferenceKey: string;
};

const defaultSpeakerPreference: SpeakerPreference = {
  voice: "female",
  accent: "british",
  pace: "natural",
};

const cleanQuestionText = (text: string) => text.replace(/\s+/g, " ").trim();

const speakerPreferenceKey = (speakerPreference?: SpeakerPreference) =>
  JSON.stringify(speakerPreference || defaultSpeakerPreference);

const audioCacheKey = (text: string, preferenceKey: string) =>
  `${preferenceKey}::${text}`;

const buildStreamingQuestionAudioUrl = (
  text: string,
  speakerPreference?: SpeakerPreference
) => {
  const preference = speakerPreference || defaultSpeakerPreference;
  const params = new URLSearchParams({
    text: cleanQuestionText(text),
    voice: preference.voice,
    accent: preference.accent,
    pace: preference.pace,
  });

  return `/api/question-audio?${params.toString()}`;
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
  const preparedSpeakerPreferenceKeyRef = useRef("");
  const activeAudioCacheKeyRef = useRef("");
  const startRecordingAfterPlaybackRef = useRef(false);
  const microphoneStartTimerRef = useRef<number | null>(null);

  const preparedAudioCacheRef = useRef<Map<string, PreparedAudioEntry>>(
    new Map()
  );
  const preparationPromiseCacheRef = useRef<Map<string, Promise<boolean>>>(
    new Map()
  );

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

  const cleanupPreparedAudioEntry = useCallback((entry: PreparedAudioEntry) => {
    try {
      entry.audio.pause();
      entry.audio.removeAttribute("src");
      entry.audio.load();
    } catch {
      // Ignore cleanup failures.
    }
  }, []);

  const setActivePreparedAudioEntry = useCallback(
    (cacheKey: string, entry: PreparedAudioEntry) => {
      questionAudioRef.current = entry.audio;
      questionAudioUrlRef.current = entry.url;
      preparedQuestionTextRef.current = entry.text;
      preparedSpeakerPreferenceKeyRef.current = entry.preferenceKey;
      activeAudioCacheKeyRef.current = cacheKey;
      setAudioReady(true);
    },
    [setAudioReady]
  );

  const cleanupPreparedQuestionAudio = useCallback(() => {
    clearMicrophoneStartTimer();

    preparedAudioCacheRef.current.forEach((entry) => {
      cleanupPreparedAudioEntry(entry);
    });

    preparedAudioCacheRef.current.clear();
    preparationPromiseCacheRef.current.clear();

    questionAudioRef.current = null;
    questionAudioUrlRef.current = null;
    questionAudioPreparingRef.current = false;
    preparedQuestionTextRef.current = "";
    preparedSpeakerPreferenceKeyRef.current = "";
    activeAudioCacheKeyRef.current = "";
    startRecordingAfterPlaybackRef.current = false;

    setQuestionAudioLoading(false);
    setAudioReady(false);
    setQuestionAudioError("");
    setQuestionAudioMessage("");
    setIsPreparedQuestionPlaying(false);
  }, [clearMicrophoneStartTimer, cleanupPreparedAudioEntry, setAudioReady]);

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

  const attachAudioHandlers = useCallback(
    (audio: HTMLAudioElement) => {
      audio.oncanplay = () => {
        if (questionAudioRef.current !== audio) return;

        setAudioReady(true);
        setQuestionAudioLoading(false);

        if (!isPreparedQuestionPlaying) {
          setQuestionAudioMessage("Interviewer voice ready.");
        }
      };

      audio.onplaying = () => {
        if (questionAudioRef.current !== audio) return;

        setIsPreparedQuestionPlaying(true);
        setQuestionAudioLoading(false);
        setQuestionAudioMessage("Playing interviewer voice...");
        onPlaybackStartRef.current?.();
      };

      audio.onended = () => {
        if (questionAudioRef.current !== audio) return;

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
        if (questionAudioRef.current !== audio) return;

        clearMicrophoneStartTimer();
        startRecordingAfterPlaybackRef.current = false;
        setIsPreparedQuestionPlaying(false);
        setQuestionAudioLoading(false);
        setAudioReady(false);

        const message =
          "Natural question audio could not play on this device.";
        setQuestionAudioError(message);
        setQuestionAudioMessage(
          "Natural question audio could not play. The written question is shown below."
        );
        onPlaybackErrorRef.current?.(message);
      };
    },
    [
      clearMicrophoneStartTimer,
      isPreparedQuestionPlaying,
      setAudioReady,
      startMicrophoneAfterAudio,
    ]
  );

  const prepareQuestionAudio = useCallback(
    async (text: string, speakerPreference?: SpeakerPreference) => {
      const safeText = cleanQuestionText(text);
      if (!safeText) return false;

      const preferenceKey = speakerPreferenceKey(speakerPreference);
      const cacheKey = audioCacheKey(safeText, preferenceKey);

      if (
        preparedQuestionTextRef.current === safeText &&
        preparedSpeakerPreferenceKeyRef.current === preferenceKey &&
        questionAudioRef.current &&
        questionAudioReadyRef.current
      ) {
        return true;
      }

      const cachedEntry = preparedAudioCacheRef.current.get(cacheKey);

      if (cachedEntry) {
        setActivePreparedAudioEntry(cacheKey, cachedEntry);
        setQuestionAudioLoading(false);
        setQuestionAudioError("");
        setQuestionAudioMessage("Interviewer voice ready.");
        return true;
      }

      const existingPreparation =
        preparationPromiseCacheRef.current.get(cacheKey);

      if (existingPreparation) {
        questionAudioPreparingRef.current = true;
        setQuestionAudioLoading(true);
        setQuestionAudioError("");
        setQuestionAudioMessage("Preparing interviewer voice...");

        const prepared = await existingPreparation;
        const preparedEntry = preparedAudioCacheRef.current.get(cacheKey);

        if (prepared && preparedEntry) {
          setActivePreparedAudioEntry(cacheKey, preparedEntry);
          setQuestionAudioLoading(false);
          setQuestionAudioMessage("Interviewer voice ready.");
        }

        questionAudioPreparingRef.current = false;
        return prepared;
      }

      questionAudioPreparingRef.current = true;
      setQuestionAudioLoading(true);
      setQuestionAudioError("");
      setQuestionAudioMessage("Preparing interviewer voice...");

      const preparationPromise = (async () => {
        try {
          const url = buildStreamingQuestionAudioUrl(safeText, speakerPreference);
          const audio = new Audio();
          audio.preload = "auto";
          audio.src = url;

          attachAudioHandlers(audio);

          const entry: PreparedAudioEntry = {
            audio,
            url,
            text: safeText,
            preferenceKey,
          };

          preparedAudioCacheRef.current.set(cacheKey, entry);
          setActivePreparedAudioEntry(cacheKey, entry);

          try {
            audio.load();
          } catch {
            // The audio element can still attempt playback later.
          }

          setQuestionAudioLoading(false);
          setQuestionAudioMessage("Interviewer voice ready.");

          return true;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Natural question audio could not be prepared.";

          clearMicrophoneStartTimer();
          setQuestionAudioLoading(false);
          setAudioReady(false);
          setQuestionAudioError(message);
          setQuestionAudioMessage(
            "Natural question audio is unavailable. Read the question or check OPENAI_API_KEY."
          );

          return false;
        } finally {
          questionAudioPreparingRef.current = false;
          preparationPromiseCacheRef.current.delete(cacheKey);
        }
      })();

      preparationPromiseCacheRef.current.set(cacheKey, preparationPromise);

      return preparationPromise;
    },
    [
      attachAudioHandlers,
      clearMicrophoneStartTimer,
      setActivePreparedAudioEntry,
      setAudioReady,
    ]
  );

  const playPreparedQuestionAudio = useCallback(
    async ({
      text,
      speakerPreference,
      startRecordingAfterPlayback = false,
      fallbackToBrowserSpeech,
    }: PlayPreparedQuestionAudioOptions) => {
      const safeText = cleanQuestionText(text);
      if (!safeText) return false;

      const preferenceKey = speakerPreferenceKey(speakerPreference);
      const cacheKey = audioCacheKey(safeText, preferenceKey);
      let audio = questionAudioRef.current;

      if (
        !audio ||
        preparedQuestionTextRef.current !== safeText ||
        preparedSpeakerPreferenceKeyRef.current !== preferenceKey
      ) {
        const cachedEntry = preparedAudioCacheRef.current.get(cacheKey);

        if (cachedEntry) {
          setActivePreparedAudioEntry(cacheKey, cachedEntry);
          audio = cachedEntry.audio;
        } else {
          const prepared = await prepareQuestionAudio(
            safeText,
            speakerPreference
          );

          if (!prepared) {
            fallbackToBrowserSpeech?.(safeText, startRecordingAfterPlayback);
            return false;
          }

          audio = questionAudioRef.current;
        }
      }

      if (!audio) return false;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      stopPreparedQuestionPlayback();
      startRecordingAfterPlaybackRef.current = startRecordingAfterPlayback;

      try {
        setQuestionAudioLoading(true);
        setQuestionAudioMessage("Starting interviewer voice...");
        audio.currentTime = 0;
        await audio.play();
        setQuestionAudioLoading(false);
        return true;
      } catch {
        clearMicrophoneStartTimer();
        startRecordingAfterPlaybackRef.current = false;
        setIsPreparedQuestionPlaying(false);
        setQuestionAudioLoading(false);

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
      setActivePreparedAudioEntry,
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