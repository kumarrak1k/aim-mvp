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

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
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

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
  }, []);

  const setTranscript = useCallback((value: string) => {
    finalTranscriptRef.current = value;
    interimTranscriptRef.current = "";
  }, []);

  const getCombinedTranscript = useCallback(() => {
    return stripQuestionLeakageFromTranscript(
      [finalTranscriptRef.current, interimTranscriptRef.current]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      activeQuestionRef.current
    );
  }, []);

  const setActiveQuestion = useCallback((value: string) => {
    activeQuestionRef.current = value;
  }, []);

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
    if (!recognitionRef.current) return false;

    try {
      setIsListening(true);
      recognitionRef.current.start();
      return true;
    } catch {
      setIsListening(false);
      onListeningErrorRef.current?.();
      return false;
    }
  }, []);

  const stopRecognitionOnly = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore duplicate stop calls.
    }

    setIsListening(false);
  }, []);

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

      recognition.onresult = (event) => {
        if (isSpeakingQuestionRef.current) {
          resetTranscript();
          onAnswerChangeRef.current("");
          return;
        }

        let newFinalText = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcriptPart = stripQuestionLeakageFromTranscript(
            event.results[index][0].transcript,
            activeQuestionRef.current
          );

          if (!transcriptPart) continue;

          if (event.results[index].isFinal) {
            newFinalText += `${transcriptPart} `;
          } else {
            interimTranscriptRef.current = transcriptPart;
          }
        }

        if (newFinalText) {
          finalTranscriptRef.current = stripQuestionLeakageFromTranscript(
            `${finalTranscriptRef.current} ${newFinalText}`
              .replace(/\s+/g, " ")
              .trim(),
            activeQuestionRef.current
          );

          onAnswerChangeRef.current(finalTranscriptRef.current);
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        const combined = getCombinedTranscript();
        finalTranscriptRef.current = combined;
        interimTranscriptRef.current = "";

        if (combined) {
          onAnswerChangeRef.current(combined);
        }

        onListeningEndRef.current?.(combined);
      };

      recognition.onerror = () => {
        setIsListening(false);
        onListeningErrorRef.current?.();
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
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [getCombinedTranscript, resetTranscript]);

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
