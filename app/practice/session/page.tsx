"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { SessionHeader } from "./components/SessionHeader";
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
  SpeakerPreference,
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
import { AnswerWorkspace } from "./components/AnswerWorkspace";
import { AssessmentNextPanel } from "./components/AssessmentNextPanel";
import { CameraWorkspace } from "./components/CameraWorkspace";
import { FeedbackWorkspace } from "./components/FeedbackWorkspace";
import { QuestionHero } from "./components/QuestionHero";
import {
  AssessmentSubmittingCard,
  LoadingSessionCard,
  MissingSessionCard,
} from "./components/SessionCards";
import { SessionSummary } from "./components/SessionSummary";
import {
  DEFAULT_TOTAL_QUESTIONS,
  createFeedbackError,
  defaultSessionConfig,
  defaultSpeakerPreference,
  parseSessionConfig,
  wait,
} from "./utils";

export default function PracticeSessionPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { manualDeviceMode } = useDeviceProfile();

  const [sessionConfig, setSessionConfig] = useState<ReturnType<
    typeof parseSessionConfig
  > | null>(null);
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
  const [speakerPreference, setSpeakerPreference] =
    useState<SpeakerPreference>(defaultSpeakerPreference);
  // totalQuestions is now driven by config (template-defined for assessment
  // invites; defaulted to 5 for the classic personal practice flow).
  const [totalQuestions, setTotalQuestions] = useState<number>(DEFAULT_TOTAL_QUESTIONS);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [assignmentToken, setAssignmentToken] = useState<string | undefined>(undefined);
  const [templateContext, setTemplateContext] = useState<
    | {
        customInstructions?: string;
        competencyFramework?: string;
        templateName?: string;
        companyName?: string;
      }
    | undefined
  >(undefined);

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

  const scrollToFeedback = useCallback(() => {
    document.getElementById("session-feedback")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
    setSpeakerPreference(config.speakerPreference || defaultSpeakerPreference);
    setTotalQuestions(config.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS);
    setAssessmentMode(Boolean(config.assessmentMode));
    setAssignmentToken(config.assignmentToken);
    setTemplateContext(config.templateContext);
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
          speakerPreference,
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
    [playPreparedQuestionAudio, setQuestionAudioMessage, speakerPreference]
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
          "Press Play question + record when you are ready."
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
    void prepareQuestionAudio(question, speakerPreference);
  }, [
    interviewStarted,
    manualDeviceMode,
    prepareQuestionAudio,
    question,
    speakerPreference,
  ]);

  const addLocalSavedSession = useCallback(
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

        try {
          localStorage.setItem("aim_sessions", JSON.stringify(nextSessions));
        } catch {
          // Keep UI state even if localStorage is unavailable.
        }

        return nextSessions;
      });
    },
    [difficulty, interviewType, role, totalQuestions]
  );

  const saveSession = useCallback(
    async (sessionSummary: InterviewSummary, sessionResults: ResultItem[]) => {
      addLocalSavedSession(sessionSummary);

      if (!isSignedIn) return;

      try {
        const response = await fetch("/api/practice-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            experienceLevel,
            interviewType,
            difficulty,
            focusArea,
            practiceMode,
            totalQuestions,
            summary: sessionSummary,
            results: sessionResults,
            speakerPreference,
            // When this session was launched from a company assessment invite,
            // forward the token so the API marks the assignment completed.
            ...(assignmentToken ? { assignmentToken } : {}),
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || data?.error) {
          console.warn(
            "Practice session was not saved to database:",
            data?.error || response.statusText
          );
        }
      } catch (error) {
        console.warn("Practice session database save failed:", error);
      }
    },
    [
      addLocalSavedSession,
      assignmentToken,
      difficulty,
      experienceLevel,
      focusArea,
      interviewType,
      isSignedIn,
      practiceMode,
      role,
      speakerPreference,
      totalQuestions,
    ]
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
          assessmentMode,
          templateContext,
        });

        setActiveQuestion(nextQuestion);
        setQuestion(nextQuestion);

        if (manualDeviceMode) {
          setQuestionAudioMessage("Preparing natural question audio...");
          void prepareQuestionAudio(nextQuestion, speakerPreference);
        } else if (speakerEnabled) {
          setQuestionAudioMessage(
            "Press Play question + record when you are ready."
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
      speakerPreference,
      totalQuestions,
      assessmentMode,
      templateContext,
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
        setQuestionAudioMessage("Preparing microphone access...");
        await primeAudioInput();
        setQuestionAudioMessage(
          "Press Play question + record when you are ready."
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

  // Once an assessment-mode session has finished and the summary save has
  // settled, send the candidate straight to their branded completion screen.
  // We wait for !summaryLoading so we don't redirect mid-save.
  useEffect(() => {
    if (
      assessmentMode &&
      assignmentToken &&
      interviewFinished &&
      !summaryLoading
    ) {
      const target = `/assessment/${encodeURIComponent(assignmentToken)}/complete`;
      const handle = window.setTimeout(() => router.push(target), 600);
      return () => window.clearTimeout(handle);
    }
  }, [assessmentMode, assignmentToken, interviewFinished, router, summaryLoading]);

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
        getCombinedTranscript() ||
          rawAnswerTranscriptRef.current.trim() ||
          answer.trim(),
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
        assessmentMode,
        templateContext,
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
    assessmentMode,
    templateContext,
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

    // Assessment candidates should not see the personal-practice setup —
    // send them straight to the completion screen for their invite token.
    if (assessmentMode && assignmentToken) {
      router.push(`/assessment/${encodeURIComponent(assignmentToken)}/complete`);
    } else {
      router.push("/practice");
    }
  }, [
    assessmentMode,
    assignmentToken,
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
          assessmentMode,
          templateContext,
        });

        setSummary(data);
        await saveSession(data, updatedResults);
      } catch {
        const fallbackSummary = buildFallbackInterviewSummary(updatedResults);
        setSummary(fallbackSummary);
        await saveSession(fallbackSummary, updatedResults);
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
    totalQuestions,
    videoAnalysis,
    voiceAnalysis,
    assessmentMode,
    templateContext,
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
      <PracticeSessionShell assessmentMode={assessmentMode} templateContext={templateContext}>
        <LoadingSessionCard message="Preparing your interview workspace..." />
      </PracticeSessionShell>
    );
  }

  if (missingSessionConfig || !sessionConfig) {
    return (
      <PracticeSessionShell assessmentMode={assessmentMode} templateContext={templateContext}>
        <MissingSessionCard />
      </PracticeSessionShell>
    );
  }

  if (interviewFinished) {
    // Assessment candidates never see the SessionSummary screen — that
    // would expose scores. Show a brief submitting state while the save
    // completes, then the post-save effect below redirects them.
    if (assessmentMode) {
      return (
        <PracticeSessionShell assessmentMode={assessmentMode} templateContext={templateContext}>
          <AssessmentSubmittingCard />
        </PracticeSessionShell>
      );
    }

    return (
      <PracticeSessionShell assessmentMode={assessmentMode} templateContext={templateContext}>
        <SessionSummary
          summaryLoading={summaryLoading}
          summary={summary}
          savedSessions={savedSessions}
          onRestart={resetInterview}
          role={role}
          userName={user?.fullName ?? user?.firstName ?? ""}
        />
      </PracticeSessionShell>
    );
  }

  return (
    <PracticeSessionShell assessmentMode={assessmentMode} templateContext={templateContext}>
      <section className="mx-auto max-w-[1720px] px-4 py-2 sm:px-6 sm:py-3">
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(360px,0.82fr)_minmax(620px,1.18fr)]">
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
            assessmentMode={assessmentMode}
          />

          <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_150px]">
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
              assessmentMode={assessmentMode}
            />

            <aside className="xl:sticky xl:top-20 xl:self-start">
              <CameraWorkspace
                cameraEnabled={cameraEnabled}
                cameraReady={cameraReady}
                cameraError={cameraError}
                cameraRequiresTap={cameraRequiresTap}
                feedbackReady={Boolean(feedback)}
                videoRef={videoRef}
                onStartCameraFromTap={startCameraFromTap}
                onViewFeedback={scrollToFeedback}
                assessmentMode={assessmentMode}
              />
            </aside>
          </div>
        </div>

        {feedback && (
          <div id="session-feedback" className="mt-3 scroll-mt-24">
            {assessmentMode ? (
              <AssessmentNextPanel
                currentQuestionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                onNext={() => void nextStep()}
                busy={questionLoading || summaryLoading}
              />
            ) : (
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
        )}
      </section>
    </PracticeSessionShell>
  );
}

function PracticeSessionShell({
  children,
  assessmentMode,
  templateContext,
}: {
  children: ReactNode;
  assessmentMode: boolean;
  templateContext?: {
    companyName?: string;
    companyBrandColor?: string;
    companyLogoUrl?: string;
    templateName?: string;
  };
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#120d1e_0%,#171224_45%,#1b1629_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-140px] top-24 z-0 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed left-[-140px] bottom-12 z-0 h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[120px]" />

      <div className="relative z-10">
        <SessionHeader
          assessmentMode={assessmentMode}
          companyName={templateContext?.companyName}
          companyBrandColor={templateContext?.companyBrandColor}
          companyLogoUrl={templateContext?.companyLogoUrl}
          templateName={templateContext?.templateName}
        />
        {children}
      </div>
    </main>
  );
}