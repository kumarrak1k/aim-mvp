"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useUser } from "@clerk/nextjs";
import { PracticeHeader } from "../components/PracticeHeader";
import { useAudioMonitoring } from "../hooks/useAudioMonitoring";
import { useBrowserSpeech } from "../hooks/useBrowserSpeech";
import { useCameraTracking } from "../hooks/useCameraTracking";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import { useQuestionAudio } from "../hooks/useQuestionAudio";
import { defaultAudioMetrics } from "../config";
import type {
  AudioMetrics,
  Feedback,
  InterviewSummary,
  PracticeMode,
  ResultItem,
  SavedSession,
  VideoAnalysis,
  VideoMetrics,
  VoiceAnalysis,
} from "../types";
import {
  buildFallbackVideoAnalysis,
  buildLocalVoiceAnalysis,
} from "../lib/analysisBuilders";
import {
  cleanTranscript as cleanTranscriptApi,
  fetchFeedback,
  fetchInterviewQuestion,
  fetchInterviewSummary,
  fetchVideoAnalysis,
  fetchVoiceAnalysis,
} from "../lib/interviewApi";
import { buildCandidateProfilePrompt } from "../lib/profileHelpers";
import {
  buildFallbackInterviewSummary,
  calculateAverageQuestionScore,
  createSavedSession,
  prependSavedSession,
} from "../lib/sessionHelpers";
import { stripQuestionLeakageFromTranscript } from "../lib/speechGuards";

const totalQuestions = 5;
const PRACTICE_SESSION_CONFIG_KEY = "aim_practice_session_config";

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

type PracticeSessionConfig = {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  createdAt?: string;
};

const defaultSessionConfig: PracticeSessionConfig = {
  role: "",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  speakerEnabled: false,
  cameraEnabled: false,
};

const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

const createFeedbackError = (message: string): Feedback => ({
  overall_score: 0,
  category_scores: {
    content: 0,
    clarity: 0,
    relevance: 0,
    structure: 0,
    confidence: 0,
  },
  pace_score: 0,
  strengths: [],
  improvements: [],
  improved_answer: "",
  error: message,
});

function parseSessionConfig(): PracticeSessionConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(PRACTICE_SESSION_CONFIG_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<PracticeSessionConfig>;

    if (!parsed.role || typeof parsed.role !== "string") {
      return null;
    }

    return {
      role: parsed.role,
      experienceLevel:
        typeof parsed.experienceLevel === "string"
          ? parsed.experienceLevel
          : defaultSessionConfig.experienceLevel,
      interviewType:
        typeof parsed.interviewType === "string"
          ? parsed.interviewType
          : defaultSessionConfig.interviewType,
      difficulty:
        typeof parsed.difficulty === "string"
          ? parsed.difficulty
          : defaultSessionConfig.difficulty,
      focusArea:
        typeof parsed.focusArea === "string"
          ? parsed.focusArea
          : defaultSessionConfig.focusArea,
      speakerEnabled: Boolean(parsed.speakerEnabled),
      cameraEnabled: Boolean(parsed.cameraEnabled),
      createdAt:
        typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
    };
  } catch {
    return null;
  }
}

export default function PracticeSessionPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { manualDeviceMode } = useDeviceProfile();

  const [sessionConfig, setSessionConfig] =
    useState<PracticeSessionConfig | null>(null);
  const [sessionConfigLoaded, setSessionConfigLoaded] = useState(false);
  const [missingSessionConfig, setMissingSessionConfig] = useState(false);

  const [role, setRole] = useState(defaultSessionConfig.role);
  const [experienceLevel, setExperienceLevel] = useState(
    defaultSessionConfig.experienceLevel
  );
  const [interviewType, setInterviewType] = useState(
    defaultSessionConfig.interviewType
  );
  const [difficulty, setDifficulty] = useState(defaultSessionConfig.difficulty);
  const [focusArea, setFocusArea] = useState(defaultSessionConfig.focusArea);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  const [questionLoading, setQuestionLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [voiceAnalysisLoading, setVoiceAnalysisLoading] = useState(false);
  const [videoAnalysisLoading, setVideoAnalysisLoading] = useState(false);
  const [cleaningTranscript, setCleaningTranscript] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [guidedAnswerRunning, setGuidedAnswerRunning] = useState(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraUserStarted, setCameraUserStarted] = useState(false);

  const latestVoiceAnalysisRef = useRef<VoiceAnalysis | null>(null);
  const latestVideoAnalysisRef = useRef<VideoAnalysis | null>(null);
  const rawAnswerTranscriptRef = useRef("");
  const recordingStartRef = useRef<number | null>(null);
  const answerDurationSecondsRef = useRef<number | null>(null);
  const guidedAnswerRunningRef = useRef(false);
  const startVoiceInputRef = useRef<(() => Promise<void>) | null>(null);
  const stopVoiceInputRef = useRef<(() => Promise<void>) | null>(null);
  const sessionBootedRef = useRef(false);

  const awaitingAutoRecordQuestionRef = useRef<string | null>(null);
  const questionPlaybackStartedRef = useRef(false);

  const requiresManualCameraStart = manualDeviceMode;

  const practiceMode = useMemo<PracticeMode>(() => {
    if (speakerEnabled && cameraEnabled) return "voice-camera";
    if (speakerEnabled) return "voice";
    return "typed";
  }, [cameraEnabled, speakerEnabled]);

  const candidateProfile = useMemo(() => {
    return buildCandidateProfilePrompt({
      role,
      experienceLevel,
      interviewType,
      difficulty,
      focusArea,
    });
  }, [difficulty, experienceLevel, focusArea, interviewType, role]);

  const averageQuestionScore = useMemo(() => {
    return calculateAverageQuestionScore(results);
  }, [results]);

  const currentQuestionNumber = results.length + 1;

  const setGuidedAnswerActive = useCallback((value: boolean) => {
    guidedAnswerRunningRef.current = value;
    setGuidedAnswerRunning(value);
  }, []);

  const {
    audioSamplesRef,
    primeAudioInput,
    startAudioMonitoring,
    cleanupAudioMonitoring,
    clearAudioSamples,
    calculateCurrentAudioMetrics,
  } = useAudioMonitoring();

  const {
    videoRef,
    cameraReady,
    cameraError,
    setCameraError,
    startCamera,
    stopCamera,
    resetVideoFrames,
    calculateCurrentVideoMetrics,
    cameraAnalysisDisabled,
  } = useCameraTracking({
    cameraEnabled,
    interviewStarted,
    requiresManualCameraStart,
    cameraUserStarted,
  });

  const {
    recognitionRef,
    activeQuestionRef,
    isSpeakingQuestionRef,
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
    stopQuestionSpeech: stopBrowserQuestionSpeech,
    startRecognitionOnly,
    stopRecognitionOnly,
  } = useBrowserSpeech({
    onAnswerChange: (value) => {
      const safeValue = stripQuestionLeakageFromTranscript(
        value,
        activeQuestionRef.current
      );
      setAnswer(safeValue);
      rawAnswerTranscriptRef.current = safeValue;
    },
    onListeningError: () => {
      setIsListening(false);
      setGuidedAnswerActive(false);
      awaitingAutoRecordQuestionRef.current = null;
      setQuestionAudioMessage(
        "Voice dictation paused. Use Start Recording if you want to continue."
      );
    },
    onQuestionSpeechEnd: () => {
      // Natural audio handles the auto-record handoff.
    },
  });

  const activeIsSpeakingQuestion = isSpeakingQuestion;

  const maybeStartPendingAutoRecord = useCallback(async () => {
    const pendingQuestion = awaitingAutoRecordQuestionRef.current;

    if (!pendingQuestion) return;
    if (pendingQuestion !== question) return;
    if (!questionPlaybackStartedRef.current) return;
    if (activeIsSpeakingQuestion) return;
    if (isListening) return;

    awaitingAutoRecordQuestionRef.current = null;
    questionPlaybackStartedRef.current = false;

    await startVoiceInputRef.current?.();
  }, [activeIsSpeakingQuestion, isListening, question]);

  const {
    questionAudioLoading,
    questionAudioReady,
    questionAudioError,
    questionAudioMessage,
    setQuestionAudioMessage,
    prepareQuestionAudio,
    playPreparedQuestionAudio,
    stopPreparedQuestionPlayback,
    cleanupPreparedQuestionAudio,
  } = useQuestionAudio({
    onPlaybackStart: () => {
      questionPlaybackStartedRef.current = true;
      isSpeakingQuestionRef.current = true;
      setIsSpeakingQuestion(true);
    },
    onPlaybackEnd: () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);
      void maybeStartPendingAutoRecord();
    },
    onGuidedPlaybackComplete: () => {
      void maybeStartPendingAutoRecord();
    },
    onPlaybackError: () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);
      awaitingAutoRecordQuestionRef.current = null;
      questionPlaybackStartedRef.current = false;
      setGuidedAnswerActive(false);
    },
  });

  useEffect(() => {
    if (
      awaitingAutoRecordQuestionRef.current &&
      !activeIsSpeakingQuestion &&
      !isListening
    ) {
      void maybeStartPendingAutoRecord();
    }
  }, [activeIsSpeakingQuestion, isListening, maybeStartPendingAutoRecord]);

  const cameraRequiresTap =
    cameraEnabled &&
    interviewStarted &&
    requiresManualCameraStart &&
    !cameraUserStarted;

  useEffect(() => {
    const stored = localStorage.getItem("aim_sessions");
    if (stored) {
      try {
        setSavedSessions(JSON.parse(stored));
      } catch {
        setSavedSessions([]);
      }
    }
  }, []);

  useEffect(() => {
    const config = parseSessionConfig();

    if (!config) {
      setMissingSessionConfig(true);
      setSessionConfigLoaded(true);
      return;
    }

    setRole(config.role);
    setExperienceLevel(config.experienceLevel);
    setInterviewType(config.interviewType);
    setDifficulty(config.difficulty);
    setFocusArea(config.focusArea);
    setSpeakerEnabled(config.speakerEnabled);
    setCameraEnabled(config.cameraEnabled);
    setSessionConfig(config);
    setSessionConfigLoaded(true);
  }, []);

  useEffect(() => {
    setActiveQuestion(question);
  }, [question, setActiveQuestion]);

  const stopQuestionSpeech = useCallback(() => {
    stopPreparedQuestionPlayback();
    stopBrowserQuestionSpeech();
    isSpeakingQuestionRef.current = false;
    setIsSpeakingQuestion(false);
    awaitingAutoRecordQuestionRef.current = null;
    questionPlaybackStartedRef.current = false;
    setGuidedAnswerActive(false);
    setQuestionAudioMessage("Question audio stopped.");
  }, [
    isSpeakingQuestionRef,
    setGuidedAnswerActive,
    setIsSpeakingQuestion,
    setQuestionAudioMessage,
    stopBrowserQuestionSpeech,
    stopPreparedQuestionPlayback,
  ]);

  const playQuestionWithNaturalAudio = useCallback(
    async (text: string, autoStartListening: boolean) => {
      const safeText = text.trim();
      if (!safeText) return false;

      if (autoStartListening) {
        awaitingAutoRecordQuestionRef.current = safeText;
        questionPlaybackStartedRef.current = false;
      } else {
        awaitingAutoRecordQuestionRef.current = null;
        questionPlaybackStartedRef.current = false;
      }

      setQuestionAudioMessage("Preparing natural question audio...");

      try {
        const played = await playPreparedQuestionAudio({
          text: safeText,
          startRecordingAfterPlayback: false,
          fallbackToBrowserSpeech: () => {
            awaitingAutoRecordQuestionRef.current = null;
            questionPlaybackStartedRef.current = false;
            setQuestionAudioMessage(
              "Natural question audio is unavailable. Read the question below and answer when ready."
            );
          },
        });

        return played;
      } catch {
        awaitingAutoRecordQuestionRef.current = null;
        questionPlaybackStartedRef.current = false;
        setQuestionAudioMessage(
          "Question audio could not start. Please use Play Question or Start Recording."
        );
        return false;
      }
    },
    [playPreparedQuestionAudio, setQuestionAudioMessage]
  );

  useEffect(() => {
    if (!question || !speakerEnabled || manualDeviceMode) return;
    if (!hasUserInteracted) return;
    if (question === lastSpokenQuestionRef.current) return;

    let cancelled = false;

    const autoPlayQuestion = async () => {
      setQuestionAudioMessage(
        "Natural question audio will play automatically, then recording will start."
      );

      const played = await playQuestionWithNaturalAudio(question, true);

      if (cancelled) return;

      if (played) {
        lastSpokenQuestionRef.current = question;
      } else {
        setQuestionAudioMessage(
          "Auto-play was blocked. Use Play Question + Record when ready."
        );
      }
    };

    void autoPlayQuestion();

    return () => {
      cancelled = true;
    };
  }, [
    hasUserInteracted,
    lastSpokenQuestionRef,
    manualDeviceMode,
    playQuestionWithNaturalAudio,
    question,
    setQuestionAudioMessage,
    speakerEnabled,
  ]);

  useEffect(() => {
    if (!question || !interviewStarted || !manualDeviceMode) return;
    void prepareQuestionAudio(question);
  }, [interviewStarted, manualDeviceMode, prepareQuestionAudio, question]);

  const saveSession = useCallback(
    (sessionSummary: InterviewSummary) => {
      const newSession = createSavedSession({
        role,
        interviewType,
        difficulty,
        totalQuestions,
        summary: sessionSummary,
      });

      setSavedSessions((currentSessions) => {
        const nextSessions = prependSavedSession(currentSessions, newSession);
        localStorage.setItem("aim_sessions", JSON.stringify(nextSessions));
        return nextSessions;
      });
    },
    [difficulty, interviewType, role]
  );

  const runVideoAnalysis = useCallback(
    async (metrics: VideoMetrics) => {
      try {
        setVideoAnalysisLoading(true);

        if (cameraAnalysisDisabled() || metrics.totalFrames === 0) {
          const fallback = buildFallbackVideoAnalysis(metrics);
          latestVideoAnalysisRef.current = fallback;
          setVideoAnalysis(fallback);
          return fallback;
        }

        const data = await fetchVideoAnalysis(metrics);
        latestVideoAnalysisRef.current = data;
        setVideoAnalysis(data);
        return data;
      } catch (error) {
        const fallback = buildFallbackVideoAnalysis(
          metrics,
          error instanceof Error
            ? error.message
            : "Video scoring could not be completed, so this is a neutral fallback video score."
        );

        latestVideoAnalysisRef.current = fallback;
        setVideoAnalysis(fallback);
        return fallback;
      } finally {
        setVideoAnalysisLoading(false);
      }
    },
    [cameraAnalysisDisabled]
  );

  const runVoiceAnalysis = useCallback(
    async (
      transcript: string,
      durationSeconds: number | null,
      audioMetrics: AudioMetrics = defaultAudioMetrics
    ) => {
      if (!transcript.trim()) return null;

      try {
        setVoiceAnalysisLoading(true);
        const data = await fetchVoiceAnalysis({
          transcript,
          durationSeconds,
          audioMetrics,
        });

        latestVoiceAnalysisRef.current = data;
        setVoiceAnalysis(data);
        return data;
      } catch {
        const fallback = buildLocalVoiceAnalysis(
          transcript,
          durationSeconds,
          audioMetrics
        );

        latestVoiceAnalysisRef.current = fallback;
        setVoiceAnalysis(fallback);
        return fallback;
      } finally {
        setVoiceAnalysisLoading(false);
      }
    },
    []
  );

  const clearCurrentAnswerCapture = useCallback(() => {
    if (recognitionRef.current && isListening) {
      stopRecognitionOnly();
    }

    cleanupAudioMonitoring();
    resetTranscript();
    clearAudioSamples();
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    rawAnswerTranscriptRef.current = "";
    latestVoiceAnalysisRef.current = null;
    latestVideoAnalysisRef.current = null;
    awaitingAutoRecordQuestionRef.current = null;
    questionPlaybackStartedRef.current = false;

    setIsListening(false);
    setAnswer("");
    setVoiceAnalysis(null);
    setVideoAnalysis(null);
    resetVideoFrames();
  }, [
    cleanupAudioMonitoring,
    clearAudioSamples,
    isListening,
    recognitionRef,
    resetTranscript,
    resetVideoFrames,
    setIsListening,
    stopRecognitionOnly,
  ]);

  const startVoiceInput = useCallback(async () => {
    if (!recognitionRef.current) {
      setGuidedAnswerActive(false);
      setQuestionAudioMessage(
        "Voice dictation is not supported on this browser. Type your answer instead."
      );
      return;
    }

    try {
      resetTranscript();
      clearAudioSamples();
      recordingStartRef.current = Date.now();
      latestVoiceAnalysisRef.current = null;
      latestVideoAnalysisRef.current = null;
      rawAnswerTranscriptRef.current = "";
      setVoiceAnalysis(null);
      setVideoAnalysis(null);

      if (cameraEnabled) {
        resetVideoFrames();

        if (!cameraReady && (!requiresManualCameraStart || cameraUserStarted)) {
          await startCamera();
        }
      }

      await startAudioMonitoring();

      setGuidedAnswerActive(false);
      setQuestionAudioMessage("Listening now. Speak naturally.");

      const started = startRecognitionOnly();

      if (!started) {
        cleanupAudioMonitoring();
        recordingStartRef.current = null;
        setQuestionAudioMessage(
          "Microphone access was not available. Use Start Recording and allow microphone access."
        );
      }
    } catch {
      setIsListening(false);
      setGuidedAnswerActive(false);
      recordingStartRef.current = null;
      cleanupAudioMonitoring();
      setQuestionAudioMessage(
        "Microphone access was not available. Use Start Recording and allow microphone access."
      );
    }
  }, [
    cameraEnabled,
    cameraReady,
    cameraUserStarted,
    cleanupAudioMonitoring,
    clearAudioSamples,
    recognitionRef,
    requiresManualCameraStart,
    resetTranscript,
    resetVideoFrames,
    setGuidedAnswerActive,
    setIsListening,
    setQuestionAudioMessage,
    startAudioMonitoring,
    startCamera,
    startRecognitionOnly,
  ]);

  useEffect(() => {
    startVoiceInputRef.current = startVoiceInput;
  }, [startVoiceInput]);

  const stopVoiceInput = useCallback(async () => {
    if (!recognitionRef.current) return;

    stopRecognitionOnly();
    setGuidedAnswerActive(false);

    await wait(650);

    const durationSeconds = recordingStartRef.current
      ? Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
      : null;

    answerDurationSecondsRef.current = durationSeconds;
    recordingStartRef.current = null;

    const audioMetrics = calculateCurrentAudioMetrics();
    const videoMetrics = cameraEnabled ? calculateCurrentVideoMetrics() : null;

    cleanupAudioMonitoring();

    if (videoMetrics) {
      await runVideoAnalysis(videoMetrics);
    }

    const rawTranscript = stripQuestionLeakageFromTranscript(
      getCombinedTranscript(),
      activeQuestionRef.current
    );

    setTranscript(rawTranscript);
    setAnswer(rawTranscript);
    rawAnswerTranscriptRef.current = rawTranscript;

    if (rawTranscript) {
      const latestVoice = await runVoiceAnalysis(
        rawTranscript,
        durationSeconds,
        audioMetrics
      );

      if (latestVoice) {
        latestVoiceAnalysisRef.current = latestVoice;
      }

      try {
        setCleaningTranscript(true);
        const cleaned = await cleanTranscriptApi(rawTranscript);
        setTranscript(cleaned || rawTranscript);
        setAnswer(cleaned || rawTranscript);
        rawAnswerTranscriptRef.current = cleaned || rawTranscript;
      } catch {
        setAnswer(rawTranscript);
      } finally {
        setCleaningTranscript(false);
      }
    }
  }, [
    activeQuestionRef,
    calculateCurrentAudioMetrics,
    calculateCurrentVideoMetrics,
    cameraEnabled,
    cleanupAudioMonitoring,
    getCombinedTranscript,
    recognitionRef,
    runVideoAnalysis,
    runVoiceAnalysis,
    setGuidedAnswerActive,
    setTranscript,
    stopRecognitionOnly,
  ]);

  useEffect(() => {
    stopVoiceInputRef.current = stopVoiceInput;
  }, [stopVoiceInput]);

  const clearVoiceAnswer = useCallback(() => {
    clearCurrentAnswerCapture();
    setGuidedAnswerActive(false);
    setQuestionAudioMessage("Answer cleared.");
  }, [clearCurrentAnswerCapture, setGuidedAnswerActive, setQuestionAudioMessage]);

  const fetchQuestion = useCallback(
    async (questionNumber: number, history: ResultItem[]) => {
      try {
        setQuestionLoading(true);
        setQuestion("");
        setAnswer("");
        setFeedback(null);
        setVoiceAnalysis(null);
        setVideoAnalysis(null);
        setQuestionAudioMessage("");
        setGuidedAnswerActive(false);
        cleanupPreparedQuestionAudio();
        latestVoiceAnalysisRef.current = null;
        latestVideoAnalysisRef.current = null;
        rawAnswerTranscriptRef.current = "";
        resetTranscript();
        recordingStartRef.current = null;
        answerDurationSecondsRef.current = null;
        clearAudioSamples();
        resetVideoFrames();
        awaitingAutoRecordQuestionRef.current = null;
        questionPlaybackStartedRef.current = false;

        const nextQuestion = await fetchInterviewQuestion({
          role: candidateProfile,
          questionNumber,
          totalQuestions,
          history,
        });

        setActiveQuestion(nextQuestion);
        setQuestion(nextQuestion);

        if (manualDeviceMode) {
          setQuestionAudioMessage("Preparing natural question audio...");
          void prepareQuestionAudio(nextQuestion);
        } else if (speakerEnabled) {
          setQuestionAudioMessage(
            "Voice mode selected. Natural question audio will play automatically..."
          );
        }
      } catch (error) {
        setQuestion(
          error instanceof Error
            ? error.message
            : "Something went wrong while generating the question."
        );
      } finally {
        setQuestionLoading(false);
      }
    },
    [
      candidateProfile,
      cleanupPreparedQuestionAudio,
      clearAudioSamples,
      manualDeviceMode,
      prepareQuestionAudio,
      resetTranscript,
      resetVideoFrames,
      setActiveQuestion,
      setGuidedAnswerActive,
      setQuestionAudioMessage,
      speakerEnabled,
    ]
  );

  const startInterview = useCallback(async () => {
    setHasUserInteracted(true);
    setInterviewStarted(true);
    setInterviewFinished(false);
    setResults([]);
    setSummary(null);
    setVoiceAnalysis(null);
    setVideoAnalysis(null);
    setCameraUserStarted(false);
    setGuidedAnswerActive(false);
    latestVoiceAnalysisRef.current = null;
    latestVideoAnalysisRef.current = null;
    rawAnswerTranscriptRef.current = "";
    lastSpokenQuestionRef.current = "";
    setActiveQuestion("");
    resetVideoFrames();
    awaitingAutoRecordQuestionRef.current = null;
    questionPlaybackStartedRef.current = false;

    if (speakerEnabled && !manualDeviceMode && voiceSupported) {
      try {
        setQuestionAudioMessage("Preparing voice mode and microphone access...");
        await primeAudioInput();
        setQuestionAudioMessage(
          "Microphone ready. The question will play, then recording will start automatically."
        );
      } catch {
        setQuestionAudioMessage(
          "Microphone permission was not available. You can still use Start Recording manually."
        );
      }
    }

    await fetchQuestion(1, []);

    if (cameraEnabled && !requiresManualCameraStart) {
      void startCamera();
    }
  }, [
    cameraEnabled,
    fetchQuestion,
    lastSpokenQuestionRef,
    manualDeviceMode,
    primeAudioInput,
    requiresManualCameraStart,
    resetVideoFrames,
    setActiveQuestion,
    setGuidedAnswerActive,
    setQuestionAudioMessage,
    speakerEnabled,
    startCamera,
    voiceSupported,
  ]);

  useEffect(() => {
    if (
      !sessionConfigLoaded ||
      !sessionConfig ||
      missingSessionConfig ||
      sessionBootedRef.current
    ) {
      return;
    }

    sessionBootedRef.current = true;
    void startInterview();
  }, [missingSessionConfig, sessionConfig, sessionConfigLoaded, startInterview]);

  const playQuestionManually = useCallback(() => {
    if (!question.trim()) return;

    setHasUserInteracted(true);
    setSpeakerEnabled(true);

    void playQuestionWithNaturalAudio(question, false);
    lastSpokenQuestionRef.current = question;
  }, [lastSpokenQuestionRef, playQuestionWithNaturalAudio, question]);

  const startGuidedAnswer = useCallback(async () => {
    if (!question.trim() || questionLoading) return;

    setHasUserInteracted(true);
    setSpeakerEnabled(true);
    setGuidedAnswerActive(true);
    clearCurrentAnswerCapture();

    if (cameraEnabled) {
      setCameraUserStarted(true);
    }

    setQuestionAudioMessage("Question audio will play, then recording will start.");
    await playQuestionWithNaturalAudio(question, true);
  }, [
    cameraEnabled,
    clearCurrentAnswerCapture,
    playQuestionWithNaturalAudio,
    question,
    questionLoading,
    setGuidedAnswerActive,
    setQuestionAudioMessage,
  ]);

  const getFeedback = useCallback(async () => {
    try {
      setHasUserInteracted(true);
      setFeedbackLoading(true);
      setFeedback(null);

      const preStopTranscript = stripQuestionLeakageFromTranscript(
        getCombinedTranscript() || rawAnswerTranscriptRef.current.trim() || answer.trim(),
        activeQuestionRef.current
      );

      if (preStopTranscript) {
        setAnswer(preStopTranscript);
        rawAnswerTranscriptRef.current = preStopTranscript;
      }

      if (isListening) {
        setQuestionAudioMessage("Stopping recording and preparing feedback...");
        await stopVoiceInputRef.current?.();
        await wait(400);
      } else {
        stopRecognitionOnly();
      }

      setIsListening(false);

      let latestVoiceAnalysis = latestVoiceAnalysisRef.current || voiceAnalysis;
      let latestVideoAnalysis = latestVideoAnalysisRef.current || videoAnalysis;

      const transcriptForVoiceAnalysis = stripQuestionLeakageFromTranscript(
        rawAnswerTranscriptRef.current.trim() || preStopTranscript || answer.trim(),
        activeQuestionRef.current
      );

      if (
        !latestVoiceAnalysis &&
        transcriptForVoiceAnalysis &&
        answerDurationSecondsRef.current
      ) {
        latestVoiceAnalysis = await runVoiceAnalysis(
          transcriptForVoiceAnalysis,
          answerDurationSecondsRef.current,
          audioSamplesRef.current.length
            ? calculateCurrentAudioMetrics()
            : defaultAudioMetrics
        );
      }

      if (
        !latestVoiceAnalysis &&
        transcriptForVoiceAnalysis &&
        answerDurationSecondsRef.current
      ) {
        latestVoiceAnalysis = buildLocalVoiceAnalysis(
          transcriptForVoiceAnalysis,
          answerDurationSecondsRef.current,
          defaultAudioMetrics
        );

        latestVoiceAnalysisRef.current = latestVoiceAnalysis;
        setVoiceAnalysis(latestVoiceAnalysis);
      }

      if (!latestVideoAnalysis && cameraEnabled) {
        latestVideoAnalysis = await runVideoAnalysis(calculateCurrentVideoMetrics());
      }

      const safeAnswer = stripQuestionLeakageFromTranscript(
        transcriptForVoiceAnalysis || answer,
        activeQuestionRef.current
      );

      if (safeAnswer !== answer) {
        setAnswer(safeAnswer);
      }

      const data = await fetchFeedback({
        question,
        answer: safeAnswer,
        voiceAnalysis: latestVoiceAnalysis,
        videoAnalysis: latestVideoAnalysis,
      });

      setFeedback(data);
    } catch (error) {
      setFeedback(
        createFeedbackError(
          error instanceof Error
            ? error.message
            : "Something went wrong while getting feedback."
        )
      );
    } finally {
      setFeedbackLoading(false);
    }
  }, [
    activeQuestionRef,
    answer,
    audioSamplesRef,
    calculateCurrentAudioMetrics,
    calculateCurrentVideoMetrics,
    cameraEnabled,
    getCombinedTranscript,
    isListening,
    question,
    runVideoAnalysis,
    runVoiceAnalysis,
    setIsListening,
    setQuestionAudioMessage,
    stopRecognitionOnly,
    videoAnalysis,
    voiceAnalysis,
  ]);

  const resetInterview = useCallback(() => {
    if (recognitionRef.current && isListening) {
      stopRecognitionOnly();
    }

    cleanupAudioMonitoring();
    cleanupPreparedQuestionAudio();
    stopQuestionSpeech();
    stopCamera();
    resetVideoFrames();
    resetTranscript();
    clearAudioSamples();

    setQuestion("");
    setAnswer("");
    setFeedback(null);
    setVoiceAnalysis(null);
    setVideoAnalysis(null);
    setResults([]);
    setSummary(null);
    setInterviewStarted(false);
    setInterviewFinished(false);
    setQuestionLoading(false);
    setFeedbackLoading(false);
    setSummaryLoading(false);
    setCleaningTranscript(false);
    setVoiceAnalysisLoading(false);
    setVideoAnalysisLoading(false);
    setCameraUserStarted(false);
    setQuestionAudioMessage("");
    setGuidedAnswerActive(false);
    setIsListening(false);
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    rawAnswerTranscriptRef.current = "";
    latestVoiceAnalysisRef.current = null;
    latestVideoAnalysisRef.current = null;
    lastSpokenQuestionRef.current = "";
    setActiveQuestion("");
    awaitingAutoRecordQuestionRef.current = null;
    questionPlaybackStartedRef.current = false;
    sessionBootedRef.current = false;

    router.push("/practice");
  }, [
    cleanupAudioMonitoring,
    cleanupPreparedQuestionAudio,
    clearAudioSamples,
    isListening,
    lastSpokenQuestionRef,
    recognitionRef,
    resetTranscript,
    resetVideoFrames,
    router,
    setActiveQuestion,
    setGuidedAnswerActive,
    setIsListening,
    setQuestionAudioMessage,
    stopCamera,
    stopQuestionSpeech,
    stopRecognitionOnly,
  ]);

  const nextStep = useCallback(async () => {
    if (!feedback) return;

    setHasUserInteracted(true);

    const safeAnswer = stripQuestionLeakageFromTranscript(
      answer,
      activeQuestionRef.current
    );

    const updatedResults = [
      ...results,
      {
        question,
        answer: safeAnswer,
        feedback,
        voiceAnalysis: latestVoiceAnalysisRef.current || voiceAnalysis,
        videoAnalysis: latestVideoAnalysisRef.current || videoAnalysis,
      },
    ];

    setResults(updatedResults);

    if (updatedResults.length >= totalQuestions) {
      setInterviewFinished(true);
      setSummaryLoading(true);
      stopQuestionSpeech();

      try {
        const data = await fetchInterviewSummary({
          role: candidateProfile,
          results: updatedResults,
        });

        setSummary(data);
        saveSession(data);
      } catch {
        const fallbackSummary = buildFallbackInterviewSummary(updatedResults);
        setSummary(fallbackSummary);
        saveSession(fallbackSummary);
      } finally {
        setSummaryLoading(false);
        setQuestion("");
        setAnswer("");
        setFeedback(null);
        setVoiceAnalysis(null);
        setVideoAnalysis(null);
        setQuestionAudioMessage("");
        setGuidedAnswerActive(false);
        cleanupPreparedQuestionAudio();
        latestVoiceAnalysisRef.current = null;
        latestVideoAnalysisRef.current = null;
        rawAnswerTranscriptRef.current = "";
        resetTranscript();
        setActiveQuestion("");
        awaitingAutoRecordQuestionRef.current = null;
        questionPlaybackStartedRef.current = false;
      }

      return;
    }

    lastSpokenQuestionRef.current = "";
    await fetchQuestion(updatedResults.length + 1, updatedResults);
  }, [
    activeQuestionRef,
    answer,
    candidateProfile,
    cleanupPreparedQuestionAudio,
    feedback,
    fetchQuestion,
    lastSpokenQuestionRef,
    question,
    resetTranscript,
    results,
    saveSession,
    setActiveQuestion,
    setGuidedAnswerActive,
    setQuestionAudioMessage,
    stopQuestionSpeech,
    videoAnalysis,
    voiceAnalysis,
  ]);

  const handleAnswerChange = useCallback(
    (value: string) => {
      const safeValue = stripQuestionLeakageFromTranscript(
        value,
        activeQuestionRef.current
      );

      setAnswer(safeValue);
      setTranscript(safeValue);
      rawAnswerTranscriptRef.current = safeValue;
      latestVoiceAnalysisRef.current = null;
      latestVideoAnalysisRef.current = null;
      setVoiceAnalysis(null);
      setVideoAnalysis(null);
    },
    [activeQuestionRef, setTranscript]
  );

  const startCameraFromTap = useCallback(() => {
    setHasUserInteracted(true);
    setCameraUserStarted(true);
    setCameraError("");
  }, [setCameraError]);

  if (!sessionConfigLoaded) {
    return (
      <PracticeSessionShell isLoaded={isLoaded} isSignedIn={isSignedIn}>
        <LoadingSessionCard message="Preparing your interview workspace..." />
      </PracticeSessionShell>
    );
  }

  if (missingSessionConfig || !sessionConfig) {
    return (
      <PracticeSessionShell isLoaded={isLoaded} isSignedIn={isSignedIn}>
        <MissingSessionCard />
      </PracticeSessionShell>
    );
  }

  if (interviewFinished) {
    return (
      <PracticeSessionShell isLoaded={isLoaded} isSignedIn={isSignedIn}>
        <SessionSummary
          summaryLoading={summaryLoading}
          summary={summary}
          savedSessions={savedSessions}
          onRestart={resetInterview}
        />
      </PracticeSessionShell>
    );
  }

  return (
    <PracticeSessionShell isLoaded={isLoaded} isSignedIn={isSignedIn}>
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:py-7">
        <QuestionHero
          question={question}
          questionLoading={questionLoading}
          currentQuestionNumber={currentQuestionNumber}
          totalQuestions={totalQuestions}
          role={role}
          interviewType={interviewType}
          difficulty={difficulty}
          focusArea={focusArea}
          practiceMode={practiceMode}
          averageQuestionScore={averageQuestionScore}
          speakerEnabled={speakerEnabled}
          speakerSupported={speakerSupported}
          questionAudioLoading={questionAudioLoading}
          questionAudioReady={questionAudioReady}
          questionAudioError={questionAudioError}
          questionAudioMessage={questionAudioMessage}
          isSpeakingQuestion={activeIsSpeakingQuestion}
          isListening={isListening}
          guidedAnswerRunning={guidedAnswerRunning}
          onPlayQuestion={playQuestionManually}
          onStopQuestion={stopQuestionSpeech}
          onStartGuidedAnswer={() => void startGuidedAnswer()}
          onBackToSetup={resetInterview}
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
          <div className="space-y-4">
            <AnswerWorkspace
              answer={answer}
              question={question}
              feedback={feedback}
              voiceSupported={voiceSupported}
              isListening={isListening}
              isSpeakingQuestion={activeIsSpeakingQuestion}
              questionLoading={questionLoading}
              questionAudioLoading={questionAudioLoading}
              cleaningTranscript={cleaningTranscript}
              feedbackLoading={feedbackLoading}
              voiceAnalysisLoading={voiceAnalysisLoading}
              videoAnalysisLoading={videoAnalysisLoading}
              onAnswerChange={handleAnswerChange}
              onStartVoice={() => void startVoiceInput()}
              onStopVoice={() => void stopVoiceInput()}
              onClear={clearVoiceAnswer}
              onFeedback={() => void getFeedback()}
            />

            {feedback && (
              <FeedbackWorkspace
                feedback={feedback}
                voiceAnalysis={voiceAnalysis}
                videoAnalysis={videoAnalysis}
                currentQuestionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                onNext={() => void nextStep()}
              />
            )}
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <CameraWorkspace
              cameraEnabled={cameraEnabled}
              cameraReady={cameraReady}
              cameraError={cameraError}
              cameraRequiresTap={cameraRequiresTap}
              videoRef={videoRef}
              onStartCameraFromTap={startCameraFromTap}
            />
          </aside>
        </div>
      </section>
    </PracticeSessionShell>
  );
}

function PracticeSessionShell({
  children,
  isLoaded,
  isSignedIn,
}: {
  children: ReactNode;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#120d1e_0%,#171224_45%,#1b1629_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-140px] top-24 z-0 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed left-[-140px] bottom-12 z-0 h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[120px]" />

      <div className="relative z-10">
        <PracticeHeader isLoaded={isLoaded} isSignedIn={isSignedIn} />
        {children}
      </div>
    </main>
  );
}

function LoadingSessionCard({ message }: { message: string }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-purple-400/50 to-cyan-300/35" />
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
          Practice session
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em]">
          {message}
        </h1>
      </div>
    </section>
  );
}

function MissingSessionCard() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
          Setup required
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em]">
          Start from the practice setup page.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-300">
          Your interview workspace needs the role, interview type and practice
          mode selected on the setup page.
        </p>
        <Link href="/practice">
          <button className="mt-7 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
            Return to setup
          </button>
        </Link>
      </div>
    </section>
  );
}

function QuestionHero({
  question,
  questionLoading,
  currentQuestionNumber,
  totalQuestions,
  role,
  interviewType,
  difficulty,
  focusArea,
  practiceMode,
  averageQuestionScore,
  speakerEnabled,
  speakerSupported,
  questionAudioLoading,
  questionAudioReady,
  questionAudioError,
  questionAudioMessage,
  isSpeakingQuestion,
  isListening,
  guidedAnswerRunning,
  onPlayQuestion,
  onStopQuestion,
  onStartGuidedAnswer,
  onBackToSetup,
}: {
  question: string;
  questionLoading: boolean;
  currentQuestionNumber: number;
  totalQuestions: number;
  role: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  practiceMode: PracticeMode;
  averageQuestionScore: number;
  speakerEnabled: boolean;
  speakerSupported: boolean;
  questionAudioLoading: boolean;
  questionAudioReady: boolean;
  questionAudioError: string;
  questionAudioMessage: string;
  isSpeakingQuestion: boolean;
  isListening: boolean;
  guidedAnswerRunning: boolean;
  onPlayQuestion: () => void;
  onStopQuestion: () => void;
  onStartGuidedAnswer: () => void;
  onBackToSetup: () => void;
}) {
  const progressPercent = Math.min(
    100,
    Math.round(((currentQuestionNumber - 1) / totalQuestions) * 100)
  );

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                Question {currentQuestionNumber}/{totalQuestions}
              </span>
              <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-black text-purple-100">
                {practiceModeLabels[practiceMode]}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-gray-300">
                Avg {averageQuestionScore}/10
              </span>
              {speakerEnabled && (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                  Natural audio
                </span>
              )}
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Current question
            </p>
            <p className="mt-1 max-w-5xl text-xs leading-5 text-gray-500 sm:text-sm">
              {role} · {interviewType} · {difficulty} difficulty · Focus: {focusArea}
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToSetup}
            className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.1]"
          >
            Back to setup
          </button>
        </div>

        <div className="rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-4 sm:p-5">
          <p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8 lg:text-[1.25rem] lg:leading-9">
            {questionLoading ? "Generating your question..." : question}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <button
            type="button"
            onClick={onStartGuidedAnswer}
            disabled={
              questionLoading ||
              !question ||
              isSpeakingQuestion ||
              isListening ||
              guidedAnswerRunning ||
              (questionAudioLoading && !questionAudioReady)
            }
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isListening
              ? "Recording..."
              : guidedAnswerRunning
                ? "Starting..."
                : questionAudioLoading && !questionAudioReady
                  ? "Preparing audio..."
                  : "Play question + record"}
          </button>

          {!isSpeakingQuestion && (speakerSupported || speakerEnabled) && (
            <button
              type="button"
              onClick={onPlayQuestion}
              disabled={
                questionLoading ||
                !question ||
                (questionAudioLoading && !questionAudioReady)
              }
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Play question only
            </button>
          )}

          {isSpeakingQuestion && (
            <button
              type="button"
              onClick={onStopQuestion}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              Stop audio
            </button>
          )}

          {(questionAudioMessage || questionAudioError) && (
            <p className="text-sm leading-6 text-gray-400 lg:ml-auto lg:max-w-xl">
              {questionAudioError || questionAudioMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function AnswerWorkspace({
  answer,
  question,
  feedback,
  voiceSupported,
  isListening,
  isSpeakingQuestion,
  questionLoading,
  questionAudioLoading,
  cleaningTranscript,
  feedbackLoading,
  voiceAnalysisLoading,
  videoAnalysisLoading,
  onAnswerChange,
  onStartVoice,
  onStopVoice,
  onClear,
  onFeedback,
}: {
  answer: string;
  question: string;
  feedback: Feedback | null;
  voiceSupported: boolean;
  isListening: boolean;
  isSpeakingQuestion: boolean;
  questionLoading: boolean;
  questionAudioLoading: boolean;
  cleaningTranscript: boolean;
  feedbackLoading: boolean;
  voiceAnalysisLoading: boolean;
  videoAnalysisLoading: boolean;
  onAnswerChange: (value: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onClear: () => void;
  onFeedback: () => void;
}) {
  const analysing = feedbackLoading || voiceAnalysisLoading || videoAnalysisLoading;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-purple-300">
              Your answer
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              Transcript and answer editor
            </h2>
          </div>

          {cleaningTranscript && (
            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
              Cleaning transcript
            </span>
          )}
        </div>

        <textarea
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          placeholder="Your answer transcript will appear here. You can also type or edit your answer before requesting feedback."
          className="min-h-[240px] w-full resize-none rounded-[1.6rem] border border-white/10 bg-black/30 p-5 text-base leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10 sm:min-h-[260px] lg:min-h-[280px]"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!isListening ? (
            <button
              type="button"
              onClick={onStartVoice}
              disabled={!voiceSupported || questionLoading || isSpeakingQuestion}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start recording
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopVoice}
              className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-300/15"
            >
              Stop recording
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            disabled={!answer || analysing}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear answer
          </button>

          <button
            type="button"
            onClick={onFeedback}
            disabled={
              !question.trim() ||
              !answer.trim() ||
              Boolean(feedback) ||
              analysing ||
              questionAudioLoading
            }
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-2"
          >
            {feedbackLoading
              ? "Preparing feedback..."
              : voiceAnalysisLoading || videoAnalysisLoading
                ? "Analysing delivery..."
                : "Get AI feedback"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FeedbackWorkspace({
  feedback,
  voiceAnalysis,
  videoAnalysis,
  currentQuestionNumber,
  totalQuestions,
  onNext,
}: {
  feedback: Feedback;
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  onNext: () => void;
}) {
  const nextLabel =
    currentQuestionNumber >= totalQuestions ? "Finish interview" : "Next question";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
              AI feedback
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              {feedback.overall_score}/10
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Structured answer review, delivery insight, and a stronger model answer.
            </p>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100"
          >
            {nextLabel}
          </button>
        </div>

        {feedback.error && (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            {feedback.error}
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ScoreCard label="Overall" value={feedback.overall_score} highlight />
          <ScoreCard label="Content" value={feedback.category_scores.content} />
          <ScoreCard label="Clarity" value={feedback.category_scores.clarity} />
          <ScoreCard label="Relevance" value={feedback.category_scores.relevance} />
          <ScoreCard label="Structure" value={feedback.category_scores.structure} />
          <ScoreCard
            label="Confidence"
            value={feedback.category_scores.confidence}
          />
        </div>

        {(voiceAnalysis || videoAnalysis) && (
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <InsightBox
              title="Voice delivery insight"
              accent="cyan"
              body={
                voiceAnalysis
                  ? `Voice score ${voiceAnalysis.overallVoiceScore}/10. Pace ${voiceAnalysis.paceScore}/10, confidence ${voiceAnalysis.confidenceScore}/10 and filler control ${voiceAnalysis.fillerScore}/10.`
                  : "Voice insight will appear here once analysis is available."
              }
            />
            <InsightBox
              title="Camera presence insight"
              accent="purple"
              body={
                videoAnalysis
                  ? `Camera score ${videoAnalysis.overallVideoScore}/10. Eye contact ${videoAnalysis.eyeContactScore}/10 and engagement ${videoAnalysis.engagementScore}/10.`
                  : "Camera insight will appear here once analysis is available."
              }
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FeedbackList title="Strengths" items={feedback.strengths} />
          <FeedbackList title="Improvements" items={feedback.improvements} />
        </div>

        {feedback.improved_answer && (
          <div className="mt-5 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Stronger answer example
            </p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-100">
              {feedback.improved_answer}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function CameraWorkspace({
  cameraEnabled,
  cameraReady,
  cameraError,
  cameraRequiresTap,
  videoRef,
  onStartCameraFromTap,
}: {
  cameraEnabled: boolean;
  cameraReady: boolean;
  cameraError: string;
  cameraRequiresTap: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onStartCameraFromTap: () => void;
}) {
  return (
    <section className="rounded-[1.65rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Camera
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Live preview</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-gray-300">
          {cameraEnabled
            ? cameraRequiresTap
              ? "Tap"
              : cameraReady
                ? "Ready"
                : "Starting"
            : "Off"}
        </span>
      </div>

      <div className="relative mx-auto h-[160px] w-[160px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-black shadow-xl shadow-black/20">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {cameraEnabled && cameraRequiresTap && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-3 text-center">
            <p className="text-[11px] leading-4 text-gray-300">Tap to start</p>
            <button
              type="button"
              onClick={onStartCameraFromTap}
              className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-black transition hover:bg-purple-100"
            >
              Start
            </button>
          </div>
        )}

        {!cameraEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-[11px] font-bold text-gray-400">Camera off</p>
          </div>
        )}
      </div>

      {cameraError && (
        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {cameraError}
        </p>
      )}
    </section>
  );
}

function SessionSummary({
  summaryLoading,
  summary,
  savedSessions,
  onRestart,
}: {
  summaryLoading: boolean;
  summary: InterviewSummary | null;
  savedSessions: SavedSession[];
  onRestart: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
          Interview complete
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
          Final readiness summary
        </h1>

        {summaryLoading && (
          <p className="mt-6 text-base leading-8 text-gray-300">
            Preparing your final interview report...
          </p>
        )}

        {summary && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
              <p className="text-sm text-gray-400">Overall score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-7xl font-black tracking-[-0.08em]">
                  {summary.overall_score}
                </span>
                <span className="mb-3 text-lg font-black text-gray-500">/10</span>
              </div>
              <p className="mt-4 rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-sm font-black text-purple-100">
                Hire signal: {summary.hire_signal}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Recommendation
              </p>
              <p className="text-base leading-8 text-gray-300">
                {summary.final_recommendation}
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeedbackList title="Top strengths" items={summary.top_strengths} />
            <FeedbackList title="Top improvements" items={summary.top_improvements} />
          </div>
        )}

        {savedSessions.length > 0 && (
          <p className="mt-6 text-sm text-gray-500">
            Saved sessions: {savedSessions.length}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            Start a new setup
          </button>
          <Link
            href="/profile"
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.1]"
          >
            Candidate Profile
          </Link>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.25rem] border p-4 ${
        highlight
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-white/10 bg-black/25"
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {value}
        <span className="text-sm text-gray-500">/10</span>
      </p>
    </div>
  );
}

function InsightBox({
  title,
  accent,
  body,
}: {
  title: string;
  accent: "cyan" | "purple";
  body: string;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 ${
        accent === "cyan"
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-purple-300/20 bg-purple-300/10"
      }`}
    >
      <p
        className={`text-sm font-black ${
          accent === "cyan" ? "text-cyan-100" : "text-purple-100"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-100">{body}</p>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
      <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-purple-200">
        {title}
      </p>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-gray-300">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-gray-500">No items yet.</p>
        )}
      </div>
    </div>
  );
}
