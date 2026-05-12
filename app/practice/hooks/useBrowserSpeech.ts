"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stripQuestionLeakageFromTranscript } from "../lib/speechGuards";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const normaliseTranscriptToUkEnglish = (value: string) => {
  return value
    .replace(/\bresume\b/gi, "CV")
    .replace(/\brésumé\b/gi, "CV")
    .replace(/\bbehavioral\b/gi, "behavioural")
    .replace(/\bbehavior\b/gi, "behaviour")
    .replace(/\bbehaviors\b/gi, "behaviours")
    .replace(/\bprioritize\b/gi, "prioritise")
    .replace(/\bprioritized\b/gi, "prioritised")
    .replace(/\bprioritizing\b/gi, "prioritising")
    .replace(/\bprioritization\b/gi, "prioritisation")
    .replace(/\banalyze\b/gi, "analyse")
    .replace(/\banalyzed\b/gi, "analysed")
    .replace(/\banalyzing\b/gi, "analysing")
    .replace(/\banalysis\b/gi, "analysis")
    .replace(/\borganization\b/gi, "organisation")
    .replace(/\borganizations\b/gi, "organisations")
    .replace(/\borganizational\b/gi, "organisational")
    .replace(/\borganize\b/gi, "organise")
    .replace(/\borganized\b/gi, "organised")
    .replace(/\borganizing\b/gi, "organising")
    .replace(/\boptimize\b/gi, "optimise")
    .replace(/\boptimized\b/gi, "optimised")
    .replace(/\boptimizing\b/gi, "optimising")
    .replace(/\boptimization\b/gi, "optimisation")
    .replace(/\bspecialize\b/gi, "specialise")
    .replace(/\bspecialized\b/gi, "specialised")
    .replace(/\bspecializing\b/gi, "specialising")
    .replace(/\bspecialization\b/gi, "specialisation")
    .replace(/\butilize\b/gi, "use")
    .replace(/\butilized\b/gi, "used")
    .replace(/\butilizing\b/gi, "using")
    .replace(/\butilization\b/gi, "use")
    .replace(/\bcolor\b/gi, "colour")
    .replace(/\bcolors\b/gi, "colours")
    .replace(/\bcenter\b/gi, "centre")
    .replace(/\bcenters\b/gi, "centres")
    .replace(/\bcredential\b/gi, "qualification")
    .replace(/\bcredentials\b/gi, "qualifications")
    .replace(/\bjob description\b/gi, "role specification")
    .replace(/\bcover letter\b/gi, "covering letter")
    .replace(/\s+/g, " ")
    .trim();
};

const buildVisibleTranscript = (finalText: string, interimText: string) => {
  return normaliseTranscriptToUkEnglish(
    [finalText, interimText]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

export function useBrowserSpeech({
  onAnswerChange,
  onListeningEnd,
  onListeningError,
  onQuestionSpeechEnd,
}: {
  onAnswerChange: (value: string) => void;
  onListeningEnd?: (value: string) => void;
  onListeningError?: () => void;
  onQuestionSpeechEnd?: () => void;
}) {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speakerSupported, setSpeakerSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const activeQuestionRef = useRef("");
  const isSpeakingQuestionRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const autoStartListeningAfterSpeechRef = useRef(false);
  const lastSpokenQuestionRef = useRef("");

  const recognitionRunningRef = useRef(false);
  const keepRecognitionAliveRef = useRef(false);
  const userStoppedRecognitionRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const onAnswerChangeRef = useRef(onAnswerChange);
  const onListeningEndRef = useRef(onListeningEnd);
  const onListeningErrorRef = useRef(onListeningError);
  const onQuestionSpeechEndRef = useRef(onQuestionSpeechEnd);

  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
    onListeningEndRef.current = onListeningEnd;
    onListeningErrorRef.current = onListeningError;
    onQuestionSpeechEndRef.current = onQuestionSpeechEnd;
  }, [onAnswerChange, onListeningEnd, onListeningError, onQuestionSpeechEnd]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
  }, []);

  const setTranscript = useCallback((value: string) => {
    finalTranscriptRef.current = normaliseTranscriptToUkEnglish(value);
    interimTranscriptRef.current = "";
  }, []);

  const getCombinedTranscript = useCallback(() => {
    return normaliseTranscriptToUkEnglish(
      stripQuestionLeakageFromTranscript(
        buildVisibleTranscript(
          finalTranscriptRef.current,
          interimTranscriptRef.current
        ),
        activeQuestionRef.current
      )
    );
  }, []);

  const pushVisibleTranscript = useCallback(() => {
    // No stripping here — stripping at display time kills valid short chunks.
    // getCombinedTranscript strips once at submission time.
    const visibleTranscript = normaliseTranscriptToUkEnglish(
      buildVisibleTranscript(
        finalTranscriptRef.current,
        interimTranscriptRef.current
      )
    );

    onAnswerChangeRef.current(visibleTranscript);
  }, []);

  const setActiveQuestion = useCallback((value: string) => {
    activeQuestionRef.current = value;
  }, []);

  const scheduleRecognitionRestart = useCallback(() => {
    clearRestartTimer();

    if (
      !keepRecognitionAliveRef.current ||
      userStoppedRecognitionRef.current ||
      !recognitionRef.current
    ) {
      return;
    }

    setIsListening(true);

    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;

      if (
        !keepRecognitionAliveRef.current ||
        userStoppedRecognitionRef.current ||
        recognitionRunningRef.current ||
        !recognitionRef.current
      ) {
        return;
      }

      try {
        recognitionRef.current.start();
      } catch {
        scheduleRecognitionRestart();
      }
    }, 350);
  }, [clearRestartTimer]);

  const getPreferredFemaleVoice = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      voicesRef.current = window.speechSynthesis.getVoices();
    }

    const voices = voicesRef.current;

    const preferredNames = [
      "Sonia",
      "Libby",
      "Olivia",
      "Aria",
      "Serena",
      "Samantha",
      "Karen",
      "Moira",
      "Natasha",
      "Victoria",
      "Emma",
      "Amy",
      "Zira",
    ];

    for (const name of preferredNames) {
      const match = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes(name.toLowerCase()) &&
          voice.lang.toLowerCase().startsWith("en")
      );
      if (match) return match;
    }

    const englishFemaleHint = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith("en") &&
        /female|woman|girl|aria|serena|samantha|karen|zira|natasha|olivia|amy|emma|sonia|libby/i.test(
          voice.name
        )
    );
    if (englishFemaleHint) return englishFemaleHint;

    const britishEnglish = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en-gb")
    );
    if (britishEnglish) return britishEnglish;

    const anyEnglish = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );
    if (anyEnglish) return anyEnglish;

    return voices[0];
  }, []);

  const stopQuestionSpeech = useCallback(() => {
    autoStartListeningAfterSpeechRef.current = false;
    isSpeakingQuestionRef.current = false;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingQuestion(false);
  }, []);

  const speakQuestion = useCallback(
    (text: string, autoStartListening: boolean) => {
      if (
        typeof window === "undefined" ||
        !window.speechSynthesis ||
        !text.trim()
      ) {
        if (autoStartListening) {
          onQuestionSpeechEndRef.current?.();
        }
        return;
      }

      autoStartListeningAfterSpeechRef.current = autoStartListening;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = "en-GB";

      const preferredVoice = getPreferredFemaleVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      }

      utterance.onstart = () => {
        isSpeakingQuestionRef.current = true;
        setIsSpeakingQuestion(true);
      };

      utterance.onend = () => {
        isSpeakingQuestionRef.current = false;
        setIsSpeakingQuestion(false);

        if (autoStartListeningAfterSpeechRef.current) {
          autoStartListeningAfterSpeechRef.current = false;
          onQuestionSpeechEndRef.current?.();
        }
      };

      utterance.onerror = () => {
        isSpeakingQuestionRef.current = false;
        setIsSpeakingQuestion(false);
        autoStartListeningAfterSpeechRef.current = false;
      };

      isSpeakingQuestionRef.current = true;
      setIsSpeakingQuestion(true);
      window.speechSynthesis.speak(utterance);
    },
    [getPreferredFemaleVoice]
  );

  const startRecognitionOnly = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return false;

    try {
      keepRecognitionAliveRef.current = true;
      userStoppedRecognitionRef.current = false;
      clearRestartTimer();

      recognition.lang = "en-GB";

      if (recognitionRunningRef.current) {
        setIsListening(true);
        return true;
      }

      setIsListening(true);
      recognition.start();
      return true;
    } catch {
      if (keepRecognitionAliveRef.current && !userStoppedRecognitionRef.current) {
        scheduleRecognitionRestart();
        return true;
      }

      recognitionRunningRef.current = false;
      setIsListening(false);
      onListeningErrorRef.current?.();
      return false;
    }
  }, [clearRestartTimer, scheduleRecognitionRestart]);

  const stopRecognitionOnly = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    keepRecognitionAliveRef.current = false;
    userStoppedRecognitionRef.current = true;
    clearRestartTimer();

    try {
      recognition.stop();
    } catch {
      recognitionRunningRef.current = false;
      setIsListening(false);
    }
  }, [clearRestartTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSpeakerSupported("speechSynthesis" in window);

    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognitionClass =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognitionClass();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-GB";

      recognition.onstart = () => {
        recognitionRunningRef.current = true;
        recognition.lang = "en-GB";
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        if (isSpeakingQuestionRef.current) {
          resetTranscript();
          onAnswerChangeRef.current("");
          return;
        }

        let newFinalText = "";
        let newInterimText = "";

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          // Do not strip per-chunk — short answer fragments share many words
          // with the question and stripping here removes valid candidate speech.
          // Stripping happens once at submission time in getCombinedTranscript.
          const transcriptPart = normaliseTranscriptToUkEnglish(
            event.results[index][0].transcript
          );

          if (!transcriptPart) continue;

          if (event.results[index].isFinal) {
            newFinalText += `${transcriptPart} `;
          } else {
            newInterimText += `${transcriptPart} `;
          }
        }

        if (newFinalText) {
          finalTranscriptRef.current = normaliseTranscriptToUkEnglish(
            `${finalTranscriptRef.current} ${newFinalText}`
              .replace(/\s+/g, " ")
              .trim()
          );
        }

        interimTranscriptRef.current = normaliseTranscriptToUkEnglish(
          newInterimText.replace(/\s+/g, " ").trim()
        );

        pushVisibleTranscript();
      };

      recognition.onend = () => {
        recognitionRunningRef.current = false;

        const combined = getCombinedTranscript();
        finalTranscriptRef.current = combined;
        interimTranscriptRef.current = "";

        if (combined) {
          onAnswerChangeRef.current(combined);
        }

        if (keepRecognitionAliveRef.current && !userStoppedRecognitionRef.current) {
          scheduleRecognitionRestart();
          return;
        }

        setIsListening(false);
        onListeningEndRef.current?.(combined);
      };

      recognition.onerror = (event) => {
        recognitionRunningRef.current = false;

        const errorCode = event?.error || "unknown";
        const hardPermissionError =
          errorCode === "not-allowed" ||
          errorCode === "service-not-allowed" ||
          errorCode === "audio-capture";

        if (
          keepRecognitionAliveRef.current &&
          !userStoppedRecognitionRef.current &&
          !hardPermissionError
        ) {
          scheduleRecognitionRestart();
          return;
        }

        setIsListening(false);

        if (!userStoppedRecognitionRef.current) {
          onListeningErrorRef.current?.();
        }
      };

      recognitionRef.current = recognition;
    }

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis?.getVoices?.() || [];
    };

    loadVoices();

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      clearRestartTimer();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {
          // Ignore cleanup failures.
        }
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [
    clearRestartTimer,
    getCombinedTranscript,
    pushVisibleTranscript,
    resetTranscript,
    scheduleRecognitionRestart,
  ]);

  return {
    recognitionRef,
    finalTranscriptRef,
    interimTranscriptRef,
    activeQuestionRef,
    isSpeakingQuestionRef,
    autoStartListeningAfterSpeechRef,
    lastSpokenQuestionRef,
    voiceSupported,
    speakerSupported,
    isListening,
    setIsListening,
    isSpeakingQuestion,
    setIsSpeakingQuestion,
    setActiveQuestion,
    resetTranscript,
    setTranscript,
    getCombinedTranscript,
    getPreferredFemaleVoice,
    speakQuestion,
    stopQuestionSpeech,
    startRecognitionOnly,
    stopRecognitionOnly,
  };
}