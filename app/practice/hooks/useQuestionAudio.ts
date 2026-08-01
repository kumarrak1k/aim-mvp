"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeakerPreference } from "../types";
import { unlockAudioOutput } from "../lib/iosAudioUnlock";
import { applyPreferredSink } from "../lib/audioDevices";

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
  pace: "natural",
};

// 25 s — the TTS API now streams so the first bytes arrive within seconds,
// but we give a generous window for slow connections.  The old 12 s value
// was tight enough to race with longer questions on a loaded OpenAI endpoint.
const AUDIO_FETCH_TIMEOUT_MS = 25000;
const PLAYBACK_START_TIMEOUT_MS = 5000;
// Brief pause before playback so pre-fetched questions don't fire the instant the user clicks.
const PLAYBACK_PRE_DELAY_MS = 800;

const cleanQuestionText = (text: string) => text.replace(/\s+/g, " ").trim();

const speakerPreferenceKey = (speakerPreference?: SpeakerPreference) =>
  JSON.stringify(speakerPreference || defaultSpeakerPreference);

const audioCacheKey = (text: string, preferenceKey: string) =>
  `${preferenceKey}::${text}`;

const audioIsPlayable = (audio: HTMLAudioElement) => audio.readyState >= 2;

const fetchQuestionAudioBlobWithTimeout = async (
  text: string,
  speakerPreference?: SpeakerPreference
) => {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, AUDIO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("/api/question-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, speakerPreference }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = "Interviewer voice could not be prepared.";

      try {
        const data = await response.json();
        message = data.error || message;
      } catch {
        // Keep fallback message.
      }

      throw new Error(message);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Interviewer voice took too long to prepare. Try Play question again."
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

// ── MediaSource streaming ────────────────────────────────────────────────────
// Instead of buffering the full blob, pipe chunks from the streaming API
// response directly into a MediaSource SourceBuffer.  The Audio element fires
// `canplay` once it has ~500 ms of data — at that point we resolve and let
// playback start, while the rest of the audio continues streaming in the
// background.  Falls back to the blob path on any failure.

/** True when the browser supports MP3 streaming via MediaSource. */
const supportsMediaSourceStreaming = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.MediaSource !== "undefined" &&
      MediaSource.isTypeSupported("audio/mpeg")
    );
  } catch {
    return false;
  }
};

/**
 * Fetch TTS audio and stream it into a MediaSource-backed Audio element.
 * Resolves as soon as `canplay` fires (first ~500 ms buffered) rather than
 * waiting for the full download.
 */
const streamQuestionAudioToEntry = async (
  text: string,
  speakerPreference?: SpeakerPreference
): Promise<{ audio: HTMLAudioElement; url: string }> => {
  const controller = new AbortController();
  const fetchTimeout = window.setTimeout(
    () => controller.abort(),
    AUDIO_FETCH_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch("/api/question-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speakerPreference }),
      signal: controller.signal,
    });
  } catch (err) {
    window.clearTimeout(fetchTimeout);
    throw err;
  }

  if (!response.ok || !response.body) {
    window.clearTimeout(fetchTimeout);
    let message = "Interviewer voice could not be prepared.";
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  const ms = new MediaSource();
  const url = URL.createObjectURL(ms);
  const audio = new Audio(url);
  audio.preload = "auto";
  applyPreferredSink(audio);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fetchTimeout);
      window.clearTimeout(canPlayGuard);
      fn();
    };

    // Resolve as soon as the browser has buffered enough to start playback.
    audio.addEventListener("canplay", () => settle(resolve), { once: true });

    // Hard timeout — give up waiting for canplay after 10 s.
    const canPlayGuard = window.setTimeout(
      () =>
        settle(() => reject(new Error("MediaSource streaming timed out"))),
      10_000
    );

    ms.addEventListener(
      "sourceopen",
      () => {
        let sb: SourceBuffer;
        try {
          sb = ms.addSourceBuffer("audio/mpeg");
        } catch (err) {
          settle(() => reject(err));
          return;
        }

        const queue: ArrayBuffer[] = [];
        let isAppending = false;
        let streamEnded = false;

        const flushQueue = () => {
          if (isAppending || !queue.length || ms.readyState !== "open") return;
          isAppending = true;
          try {
            sb.appendBuffer(queue.shift()!);
          } catch {
            isAppending = false;
          }
        };

        sb.addEventListener("updateend", () => {
          isAppending = false;
          if (streamEnded && !queue.length) {
            try {
              if (ms.readyState === "open") ms.endOfStream();
            } catch {
              // Ignore.
            }
            // Resolve here too in case canplay never fired (short audio).
            settle(resolve);
          } else {
            flushQueue();
          }
        });

        void (async () => {
          const reader = response.body!.getReader();
          try {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) {
                streamEnded = true;
                // If nothing is currently appending and queue is empty, end now.
                if (!isAppending && !queue.length) {
                  try {
                    if (ms.readyState === "open") ms.endOfStream();
                  } catch {
                    // Ignore.
                  }
                  settle(resolve);
                }
                break;
              }
              // Slice to own the ArrayBuffer (value may alias a shared buffer).
              queue.push(
                value.buffer.slice(
                  value.byteOffset,
                  value.byteOffset + value.byteLength
                )
              );
              flushQueue();
            }
          } catch (err) {
            settle(() => reject(err));
          }
        })();
      },
      { once: true }
    );
  });

  return { audio, url };
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
  const audioGenerationRef = useRef(0);

  const preparedAudioCacheRef = useRef<Map<string, PreparedAudioEntry>>(
    new Map()
  );

  const preparationPromiseCacheRef = useRef<Map<string, Promise<boolean>>>(
    new Map()
  );

  // Background (prefetch) audio: kept in a separate cache that
  // cleanupPreparedQuestionAudio does NOT clear. Promoted to the
  // main cache when prepareQuestionAudio is called for the same text.
  const backgroundAudioCacheRef = useRef<Map<string, PreparedAudioEntry>>(new Map());
  const backgroundPromiseCacheRef = useRef<Map<string, Promise<void>>>(new Map());
  const backgroundGenerationRef = useRef(0);

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

    try {
      URL.revokeObjectURL(entry.url);
    } catch {
      // Ignore cleanup failures.
    }
  }, []);

  const clearBackgroundAudio = useCallback(() => {
    backgroundGenerationRef.current += 1;
    backgroundAudioCacheRef.current.forEach((entry) => cleanupPreparedAudioEntry(entry));
    backgroundAudioCacheRef.current.clear();
    backgroundPromiseCacheRef.current.clear();
  }, [cleanupPreparedAudioEntry]);

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
        setQuestionAudioError("");
        setQuestionAudioMessage("Interviewer voice ready.");
      }
    },
    [setAudioReady]
  );

  const notifyPlaybackStarted = useCallback((audio: HTMLAudioElement) => {
    if (questionAudioRef.current !== audio) return;
    if (playbackStartNotifiedRef.current) return;

    playbackStartNotifiedRef.current = true;
    setIsPreparedQuestionPlaying(true);
    setQuestionAudioLoading(false);
    setQuestionAudioError("");
    setQuestionAudioMessage("Playing interviewer voice...");
    onPlaybackStartRef.current?.();
  }, []);

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
      audio.onloadeddata = () => {
        if (questionAudioRef.current !== audio) return;

        setAudioReady(true);
        setQuestionAudioLoading(false);
        setQuestionAudioError("");

        if (audio.paused) {
          setQuestionAudioMessage("Interviewer voice ready.");
        }
      };

      audio.oncanplay = () => {
        if (questionAudioRef.current !== audio) return;

        setAudioReady(true);
        setQuestionAudioLoading(false);
        setQuestionAudioError("");

        if (audio.paused) {
          setQuestionAudioMessage("Interviewer voice ready.");
        }
      };

      audio.onplaying = () => {
        notifyPlaybackStarted(audio);
      };

      audio.onwaiting = () => {
        if (questionAudioRef.current !== audio) return;
        setQuestionAudioMessage("Buffering interviewer voice...");
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
        playbackStartNotifiedRef.current = false;
        startRecordingAfterPlaybackRef.current = false;
        setIsPreparedQuestionPlaying(false);
        setQuestionAudioLoading(false);
        setAudioReady(false);

        const message = "Interviewer voice could not play.";
        setQuestionAudioError(message);
        setQuestionAudioMessage(
          "Interviewer voice could not play. Try Play question again, or start recording manually."
        );
        onPlaybackErrorRef.current?.(message);
      };
    },
    [
      clearMicrophoneStartTimer,
      notifyPlaybackStarted,
      setAudioReady,
      startMicrophoneAfterAudio,
    ]
  );

  const cleanupPreparedQuestionAudio = useCallback(() => {
    audioGenerationRef.current += 1;
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

  const prepareQuestionAudioBackground = useCallback(
    async (text: string, speakerPreference?: SpeakerPreference): Promise<void> => {
      const safeText = cleanQuestionText(text);
      if (!safeText) return;

      const preferenceKey = speakerPreferenceKey(speakerPreference);
      const cacheKey = audioCacheKey(safeText, preferenceKey);

      // Already cached or in-flight
      if (
        backgroundAudioCacheRef.current.has(cacheKey) ||
        backgroundPromiseCacheRef.current.has(cacheKey)
      )
        return;

      const bgGen = backgroundGenerationRef.current;

      const promise = (async () => {
        try {
          let audio: HTMLAudioElement;
          let url: string;
          let usedStreaming = false;

          if (supportsMediaSourceStreaming()) {
            try {
              ({ audio, url } = await streamQuestionAudioToEntry(safeText, speakerPreference));
              usedStreaming = true;
            } catch {
              const blob = await fetchQuestionAudioBlobWithTimeout(safeText, speakerPreference);
              url = URL.createObjectURL(blob);
              audio = new Audio(url);
            }
          } else {
            const blob = await fetchQuestionAudioBlobWithTimeout(safeText, speakerPreference);
            url = URL.createObjectURL(blob);
            audio = new Audio(url);
          }

          if (bgGen !== backgroundGenerationRef.current) {
            URL.revokeObjectURL(url);
            return;
          }

          audio.preload = "auto";
          applyPreferredSink(audio);
          // Attach handlers now. All are guarded by `questionAudioRef.current !== audio`
          // so they're no-ops while the audio is in the background cache.
          // Once promoted (questionAudioRef set to this element), they become active.
          attachAudioHandlers(audio);

          if (!usedStreaming) {
            try {
              audio.load();
            } catch {
              // Ignore.
            }
          }

          backgroundAudioCacheRef.current.set(cacheKey, {
            audio,
            url,
            text: safeText,
            preferenceKey,
          });
        } catch {
          // Silently fail — prepareQuestionAudio will handle it normally.
        } finally {
          backgroundPromiseCacheRef.current.delete(cacheKey);
        }
      })();

      backgroundPromiseCacheRef.current.set(cacheKey, promise);
    },
    [attachAudioHandlers]
  );

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

  const waitForPlaybackStart = useCallback(
    (audio: HTMLAudioElement, playPromise: Promise<void>) => {
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
          audio.removeEventListener("emptied", handleError);

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
          finish(false);
        };

        const timeout = window.setTimeout(() => {
          finish(false);
        }, PLAYBACK_START_TIMEOUT_MS);

        audio.addEventListener("playing", handlePlaying);
        audio.addEventListener("error", handleError);
        audio.addEventListener("stalled", handleStalled);
        audio.addEventListener("emptied", handleError);

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

  const createPreparedAudioEntry = useCallback(
    async ({
      cacheKey,
      preferenceKey,
      safeText,
      speakerPreference,
      generation,
    }: {
      cacheKey: string;
      preferenceKey: string;
      safeText: string;
      speakerPreference?: SpeakerPreference;
      generation: number;
    }) => {
      const previousEntry = preparedAudioCacheRef.current.get(cacheKey);

      if (previousEntry) {
        cleanupPreparedAudioEntry(previousEntry);
        preparedAudioCacheRef.current.delete(cacheKey);
      }

      // Try MediaSource streaming for lower latency (resolves on first ~500 ms
      // of audio rather than waiting for the full download).  Fall back to the
      // blob path on any failure or when MediaSource isn't supported.
      let audio: HTMLAudioElement;
      let url: string;
      let usedStreaming = false;

      if (supportsMediaSourceStreaming()) {
        try {
          ({ audio, url } = await streamQuestionAudioToEntry(
            safeText,
            speakerPreference
          ));
          usedStreaming = true;
        } catch {
          // MediaSource failed — fall through to the reliable blob path.
          const blob = await fetchQuestionAudioBlobWithTimeout(
            safeText,
            speakerPreference
          );
          url = URL.createObjectURL(blob);
          audio = new Audio(url);
        }
      } else {
        const blob = await fetchQuestionAudioBlobWithTimeout(
          safeText,
          speakerPreference
        );
        url = URL.createObjectURL(blob);
        audio = new Audio(url);
      }

      if (generation !== audioGenerationRef.current) {
        URL.revokeObjectURL(url);
        return null;
      }

      audio.preload = "auto";
      applyPreferredSink(audio);
      attachAudioHandlers(audio);

      const entry: PreparedAudioEntry = {
        audio,
        url,
        text: safeText,
        preferenceKey,
      };

      preparedAudioCacheRef.current.set(cacheKey, entry);
      setActivePreparedAudioEntry(cacheKey, entry);

      // For MediaSource entries the audio element loads automatically when
      // src is set — calling audio.load() would reset the stream.
      if (!usedStreaming) {
        try {
          audio.load();
        } catch {
          // Audio can still attempt playback later.
        }
      }

      return entry;
    },
    [
      attachAudioHandlers,
      cleanupPreparedAudioEntry,
      setActivePreparedAudioEntry,
    ]
  );

  const prepareQuestionAudio = useCallback(
    async (text: string, speakerPreference?: SpeakerPreference) => {
      const safeText = cleanQuestionText(text);
      if (!safeText) return false;

      const preferenceKey = speakerPreferenceKey(speakerPreference);
      const cacheKey = audioCacheKey(safeText, preferenceKey);

      // Check if background audio prep already finished
      const bgEntry = backgroundAudioCacheRef.current.get(cacheKey);
      if (bgEntry) {
        backgroundAudioCacheRef.current.delete(cacheKey);
        preparedAudioCacheRef.current.set(cacheKey, bgEntry);
        setActivePreparedAudioEntry(cacheKey, bgEntry);
        setQuestionAudioLoading(false);
        setQuestionAudioError("");
        setQuestionAudioMessage("Interviewer voice ready.");
        return true;
      }

      // Check if background prep is still in-flight
      const bgPromise = backgroundPromiseCacheRef.current.get(cacheKey);
      if (bgPromise) {
        setQuestionAudioLoading(true);
        setQuestionAudioError("");
        setQuestionAudioMessage("Preparing interviewer voice...");
        await bgPromise;
        // Promise finished — check if it succeeded
        const bgEntryAfterWait = backgroundAudioCacheRef.current.get(cacheKey);
        if (bgEntryAfterWait) {
          backgroundAudioCacheRef.current.delete(cacheKey);
          preparedAudioCacheRef.current.set(cacheKey, bgEntryAfterWait);
          setActivePreparedAudioEntry(cacheKey, bgEntryAfterWait);
          setQuestionAudioLoading(false);
          setQuestionAudioMessage("Interviewer voice ready.");
          return true;
        }
        setQuestionAudioLoading(false);
        // Background failed — fall through to normal preparation below
      }

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

      const generation = audioGenerationRef.current;

      questionAudioPreparingRef.current = true;
      setQuestionAudioLoading(true);
      setQuestionAudioError("");
      setQuestionAudioMessage("Preparing interviewer voice...");

      const preparationPromise = (async () => {
        try {
          const entry = await createPreparedAudioEntry({
            cacheKey,
            preferenceKey,
            safeText,
            speakerPreference,
            generation,
          });

          if (!entry) {
            return false;
          }

          setAudioReady(audioIsPlayable(entry.audio));
          setQuestionAudioLoading(false);
          setQuestionAudioMessage("Interviewer voice ready.");

          return true;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Interviewer voice could not be prepared.";

          clearMicrophoneStartTimer();
          setQuestionAudioLoading(false);
          setAudioReady(false);
          setQuestionAudioError(message);
          setQuestionAudioMessage(
            "Interviewer voice could not be prepared. Try Play question again, or start recording manually."
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
      clearMicrophoneStartTimer,
      createPreparedAudioEntry,
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
      // iOS Safari blocks audio.play() when it is called asynchronously after
      // a user gesture. Playing a silent sound RIGHT NOW (synchronously, before
      // any await) unlocks the audio session for this page load so that all
      // subsequent play() calls — even on elements created later — are allowed.
      unlockAudioOutput();

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
        setQuestionAudioMessage("Starting interviewer voice...");

        try {
          audio.currentTime = 0;
        } catch {
          // Some browsers do not allow seeking before metadata loads.
        }

        await new Promise<void>((resolve) =>
          window.setTimeout(resolve, PLAYBACK_PRE_DELAY_MS)
        );

        const playPromise = audio.play();
        const started = await waitForPlaybackStart(audio, playPromise);

        if (!started) {
          throw new Error("Interviewer voice did not start.");
        }

        setQuestionAudioLoading(false);
        return true;
      } catch (error) {
        clearMicrophoneStartTimer();
        playbackStartNotifiedRef.current = false;
        startRecordingAfterPlaybackRef.current = false;
        setIsPreparedQuestionPlaying(false);
        setQuestionAudioLoading(false);

        try {
          audio.pause();
        } catch {
          // Ignore playback cleanup failures.
        }

        const message =
          error instanceof Error
            ? `${error.message} Try Play question again, or start recording manually.`
            : "Interviewer voice could not start. Try Play question again, or start recording manually.";

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
      waitForPlaybackStart,
    ]
  );

  useEffect(() => {
    return () => {
      cleanupPreparedQuestionAudio();
      clearBackgroundAudio();
    };
  }, [cleanupPreparedQuestionAudio, clearBackgroundAudio]);

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
    prepareQuestionAudioBackground,
    playPreparedQuestionAudio,
    stopPreparedQuestionPlayback,
    cleanupPreparedQuestionAudio,
    clearBackgroundAudio,
  };
}