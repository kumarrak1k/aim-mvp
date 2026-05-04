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

const AUDIO_READY_TIMEOUT_MS = 9000;
const PLAYBACK_START_TIMEOUT_MS = 9000;

const cleanQuestionText = (text: string) => text.replace(/\s+/g, " ").trim();

const speakerPreferenceKey = (speakerPreference?: SpeakerPreference) =>
  JSON.stringify(speakerPreference || defaultSpeakerPreference);

const audioCacheKey = (text: string, preferenceKey: string) =>
  `${preferenceKey}::${text}`;

const audioIsPlayable = (audio: HTMLAudioElement) => {
  return audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
};

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
  const playbackStartNotifiedRef = useRef(false);

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

  const markAudioReady = useCallback(
    (audio: HTMLAudioElement) => {
      if (questionAudioRef.current !== audio) return;

      setAudioReady(true);
      setQuestionAudioLoading(false);
      setQuestionAudioError("");

      if (audio.paused) {
        setQuestionAudioMessage("Interviewer voice ready.");
      }
    },
    [setAudioReady]
  );

  const notifyPlaybackStarted = useCallback(
    (audio: HTMLAudioElement) => {
      if (questionAudioRef.current !== audio) return;
      if (playbackStartNotifiedRef.current) return;

      playbackStartNotifiedRef.current = true;
      setIsPreparedQuestionPlaying(true);
      setQuestionAudioLoading(false);
      setQuestionAudioMessage("Playing interviewer voice...");
      onPlaybackStartRef.current?.();
    },
    []
  );

  const setActivePreparedAudioEntry = useCallback(
    (cacheKey: string, entry: PreparedAudioEntry) => {
      questionAudioRef.current = entry.audio;
      questionAudioUrlRef.current = entry.url;
      preparedQuestionTextRef.current = entry.text;
      preparedSpeakerPreferenceKeyRef.current = entry.preferenceKey;
      activeAudioCacheKeyRef.current = cacheKey;

      const playable = audioIsPlayable(entry.audio);
      setAudioReady(playable);

      if (playable) {
        setQuestionAudioMessage("Interviewer voice ready.");
      }
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
    playbackStartNotifiedRef.current = false;

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
    playbackStartNotifiedRef.current = false;
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

  const waitForAudioReady = useCallback(
    (audio: HTMLAudioElement, timeoutMs = AUDIO_READY_TIMEOUT_MS) => {
      if (audioIsPlayable(audio)) {
        markAudioReady(audio);
        return Promise.resolve(true);
      }

      return new Promise<boolean>((resolve) => {
        let settled = false;

        const finish = (value: boolean) => {
          if (settled) return;
          settled = true;

          window.clearTimeout(timeout);

          audio.removeEventListener("loadeddata", handleReady);
          audio.removeEventListener("canplay", handleReady);
          audio.removeEventListener("canplaythrough", handleReady);
          audio.removeEventListener("playing", handleReady);
          audio.removeEventListener("error", handleError);
          audio.removeEventListener("stalled", handleStalled);

          resolve(value);
        };

        const handleReady = () => {
          markAudioReady(audio);
          finish(true);
        };

        const handleError = () => {
          finish(false);
        };

        const handleStalled = () => {
          setQuestionAudioMessage(
            "Interviewer voice is taking a little longer than expected..."
          );
        };

        const timeout = window.setTimeout(() => {
          finish(false);
        }, timeoutMs);

        audio.addEventListener("loadeddata", handleReady);
        audio.addEventListener("canplay", handleReady);
        audio.addEventListener("canplaythrough", handleReady);
        audio.addEventListener("playing", handleReady);
        audio.addEventListener("error", handleError);
        audio.addEventListener("stalled", handleStalled);

        try {
          audio.load();
        } catch {
          // The audio element may still become playable after play().
        }
      });
    },
    [markAudioReady]
  );

  const waitForPlaybackStart = useCallback(
    (
      audio: HTMLAudioElement,
      playPromise: Promise<void>,
      timeoutMs = PLAYBACK_START_TIMEOUT_MS
    ) => {
      if (!audio.paused && !audio.ended) {
        notifyPlaybackStarted(audio);
        return Promise.resolve(true);
      }

      return new Promise<boolean>((resolve) => {
        let settled = false;

        const finish = (value: boolean) => {
          if (settled) return;
          settled = true;

          window.clearTimeout(timeout);

          audio.removeEventListener("playing", handlePlaying);
          audio.removeEventListener("error", handleError);
          audio.removeEventListener("stalled", handleStalled);
          audio.removeEventListener("waiting", handleWaiting);

          resolve(value);
        };

        const handlePlaying = () => {
          notifyPlaybackStarted(audio);
          finish(true);
        };

        const handleError = () => {
          finish(false);
        };

        const handleStalled = () => {
          setQuestionAudioMessage(
            "Interviewer voice is taking a little longer than expected..."
          );
        };

        const handleWaiting = () => {
          setQuestionAudioMessage("Buffering interviewer voice...");
        };

        const timeout = window.setTimeout(() => {
          finish(false);
        }, timeoutMs);

        audio.addEventListener("playing", handlePlaying);
        audio.addEventListener("error", handleError);
        audio.addEventListener("stalled", handleStalled);
        audio.addEventListener("waiting", handleWaiting);

        playPromise
          .then(() => {
            if (!audio.paused && !audio.ended) {
              notifyPlaybackStarted(audio);
              finish(true);
            }
          })
          .catch(() => {
            finish(false);
          });
      });
    },
    [notifyPlaybackStarted]
  );

  const attachAudioHandlers = useCallback(
    (audio: HTMLAudioElement) => {
      audio.onloadeddata = () => {
        markAudioReady(audio);
      };

      audio.oncanplay = () => {
        markAudioReady(audio);
      };

      audio.onplaying = () => {
        notifyPlaybackStarted(audio);
      };

      audio.onwaiting = () => {
        if (questionAudioRef.current !== audio) return;
        setQuestionAudioMessage("Buffering interviewer voice...");
      };

      audio.onstalled = () => {
        if (questionAudioRef.current !== audio) return;
        setQuestionAudioMessage(
          "Interviewer voice is taking a little longer than expected..."
        );
      };

      audio.onended = () => {
        if (questionAudioRef.current !== audio) return;

        playbackStartNotifiedRef.current = false;
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
        playbackStartNotifiedRef.current = false;
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
    },
    [
      clearMicrophoneStartTimer,
      markAudioReady,
      notifyPlaybackStarted,
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
        questionAudioRef.current
      ) {
        return true;
      }

      const cachedEntry = preparedAudioCacheRef.current.get(cacheKey);

      if (cachedEntry) {
        setActivePreparedAudioEntry(cacheKey, cachedEntry);
        setQuestionAudioLoading(false);
        setQuestionAudioError("");

        if (!audioIsPlayable(cachedEntry.audio)) {
          void waitForAudioReady(cachedEntry.audio, 3500);
        }

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

          void waitForAudioReady(audio, 3500);

          setQuestionAudioLoading(false);
          setQuestionAudioMessage("Interviewer voice preparing...");

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
      waitForAudioReady,
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
      playbackStartNotifiedRef.current = false;

      try {
        setQuestionAudioLoading(true);
        setQuestionAudioError("");

        if (!audioIsPlayable(audio)) {
          setQuestionAudioMessage("Preparing interviewer voice...");
          const ready = await waitForAudioReady(audio, AUDIO_READY_TIMEOUT_MS);

          if (!ready) {
            throw new Error("Interviewer voice took too long to prepare.");
          }
        }

        setQuestionAudioMessage("Starting interviewer voice...");
        audio.currentTime = 0;

        const playPromise = audio.play();
        const started = await waitForPlaybackStart(
          audio,
          playPromise,
          PLAYBACK_START_TIMEOUT_MS
        );

        if (!started) {
          throw new Error("Interviewer voice took too long to start.");
        }

        setQuestionAudioLoading(false);
        return true;
      } catch (error) {
        clearMicrophoneStartTimer();
        startRecordingAfterPlaybackRef.current = false;
        playbackStartNotifiedRef.current = false;
        setIsPreparedQuestionPlaying(false);
        setQuestionAudioLoading(false);
        setAudioReady(false);

        try {
          audio.pause();
        } catch {
          // Ignore playback cleanup failures.
        }

        const message =
          error instanceof Error
            ? `${error.message} Try Play question again, or start recording manually.`
            : "This device blocked natural audio playback. Try Play question again, or start recording manually.";

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
      setAudioReady,
      stopPreparedQuestionPlayback,
      waitForAudioReady,
      waitForPlaybackStart,
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