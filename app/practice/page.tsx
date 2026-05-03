"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { PracticeHeader } from "./components/PracticeHeader";
import { PracticeHero } from "./components/PracticeHero";
import { PracticeStartScreen } from "./components/PracticeStartScreen";
import { PracticeSessionHeader } from "./components/PracticeSessionHeader";
import { PracticeCoachPanel } from "./components/PracticeCoachPanel";
import { PracticeAnswerPanel } from "./components/PracticeAnswerPanel";
import { PracticeDeliveryAnalysis } from "./components/PracticeDeliveryAnalysis";
import { PracticeFeedbackPanel } from "./components/PracticeFeedbackPanel";
import { PracticeSummaryPanel } from "./components/PracticeSummaryPanel";
import { useAudioMonitoring } from "./hooks/useAudioMonitoring";
import { useBrowserSpeech } from "./hooks/useBrowserSpeech";
import { useCameraTracking } from "./hooks/useCameraTracking";
import { useDeviceProfile } from "./hooks/useDeviceProfile";
import { useQuestionAudio } from "./hooks/useQuestionAudio";
import { defaultAudioMetrics } from "./config";
import type {
  CandidateProfile,
  Feedback,
  InterviewSummary,
  ResultItem,
  SavedSession,
  VideoAnalysis,
  VideoMetrics,
  VoiceAnalysis,
} from "./types";
import {
  buildFallbackVideoAnalysis,
  buildLocalVoiceAnalysis,
} from "./lib/analysisBuilders";
import {
  fetchCandidateProfile,
  fetchFeedback,
  fetchInterviewQuestion,
  fetchInterviewSummary,
  fetchVideoAnalysis,
  fetchVoiceAnalysis,
  cleanTranscript as cleanTranscriptApi,
} from "./lib/interviewApi";
import {
  buildAutofilledRoleFromProfile,
  buildCandidateProfilePrompt,
} from "./lib/profileHelpers";
import {
  buildFallbackInterviewSummary,
  calculateAverageQuestionScore,
  createSavedSession,
  prependSavedSession,
} from "./lib/sessionHelpers";
import { stripQuestionLeakageFromTranscript } from "./lib/speechGuards";

const totalQuestions = 5;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

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

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const { manualDeviceMode } = useDeviceProfile();

  const [role, setRole] = useState("");
  const [savedCandidateProfile, setSavedCandidateProfile] =
    useState<CandidateProfile | null>(null);
  const [profileContextLoaded, setProfileContextLoaded] = useState(false);
  const [roleAutofilledFromProfile, setRoleAutofilledFromProfile] =
    useState(false);

  const [experienceLevel, setExperienceLevel] = useState(
    "Graduate / entry level"
  );
  const [interviewType, setInterviewType] = useState(
    "Competency / behavioural"
  );
  const [difficulty, setDifficulty] = useState("Standard");
  const [focusArea, setFocusArea] = useState("Balanced");

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

  const roleRef = useRef("");
  const roleManuallyEditedRef = useRef(false);
  const latestVoiceAnalysisRef = useRef<VoiceAnalysis | null>(null);
  const latestVideoAnalysisRef = useRef<VideoAnalysis | null>(null);
  const rawAnswerTranscriptRef = useRef("");
  const recordingStartRef = useRef<number | null>(null);
  const answerDurationSecondsRef = useRef<number | null>(null);
  const guidedAnswerRunningRef = useRef(false);
  const startVoiceInputRef = useRef<(() => Promise<void>) | null>(null);

  const requiresManualCameraStart = manualDeviceMode;
  const shouldAutoSpeakQuestions = speakerEnabled && !manualDeviceMode;

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
    speakQuestion,
    stopQuestionSpeech: stopBrowserQuestionSpeech,
    startRecognitionOnly,
    stopRecognitionOnly,
  } = useBrowserSpeech({
    onAnswerChange: setAnswer,
    onListeningError: () => {
      setIsListening(false);
      setGuidedAnswerActive(false);
      setQuestionAudioMessage(
        "Voice dictation stopped. If this happens after auto-play, click Start Voice Answer once or check microphone permission."
      );
    },
    onQuestionSpeechEnd: () => {
      void startVoiceInputRef.current?.();
    },
  });

  const {
    questionAudioLoading,
    questionAudioReady,
    questionAudioError,
    questionAudioMessage,
    isPreparedQuestionPlaying,
    setQuestionAudioMessage,
    prepareQuestionAudio,
    playPreparedQuestionAudio,
    stopPreparedQuestionPlayback,
    cleanupPreparedQuestionAudio,
  } = useQuestionAudio({
    onPlaybackStart: () => {
      isSpeakingQuestionRef.current = true;
      setIsSpeakingQuestion(true);
    },
    onPlaybackEnd: () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);
    },
    onGuidedPlaybackComplete: () => {
      void startVoiceInputRef.current?.();
    },
    onPlaybackError: () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);
      setGuidedAnswerActive(false);
    },
  });

  const cameraRequiresTap =
    cameraEnabled &&
    interviewStarted &&
    requiresManualCameraStart &&
    !cameraUserStarted;

  const activeIsSpeakingQuestion = isSpeakingQuestion || isPreparedQuestionPlaying;

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
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    setActiveQuestion(question);
  }, [question, setActiveQuestion]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSavedCandidateProfile(null);
      setProfileContextLoaded(true);
      return;
    }

    let cancelled = false;

    const loadCandidateProfile = async () => {
      try {
        setProfileContextLoaded(false);
        const profile = await fetchCandidateProfile();

        if (cancelled) return;

        setSavedCandidateProfile(profile);

        const autofilledRole = buildAutofilledRoleFromProfile(profile);

        if (
          autofilledRole &&
          !roleRef.current.trim() &&
          !roleManuallyEditedRef.current &&
          !interviewStarted
        ) {
          setRole(autofilledRole);
          setRoleAutofilledFromProfile(true);
        }

        setProfileContextLoaded(true);
      } catch {
        if (!cancelled) {
          setSavedCandidateProfile(null);
          setProfileContextLoaded(true);
        }
      }
    };

    void loadCandidateProfile();

    return () => {
      cancelled = true;
    };
  }, [interviewStarted, isLoaded, isSignedIn]);

  const playBrowserQuestionFallback = useCallback(
    (text: string, autoStartListening: boolean) => {
      setQuestionAudioMessage(
        "Natural question audio is unavailable. Browser robotic voice is disabled; read the question or check OPENAI_API_KEY."
      );

      if (autoStartListening) {
        setGuidedAnswerActive(false);
      }

      if (!text.trim()) return;
      // Deliberately do not call speakQuestion here. Browser speech sounds robotic.
    },
    [setGuidedAnswerActive, setQuestionAudioMessage]
  );

  const playQuestionWithNaturalAudio = useCallback(
    async (text: string, autoStartListening: boolean) => {
      const safeText = text.trim();
      if (!safeText) return false;

      setQuestionAudioMessage("Preparing natural question audio...");

      return playPreparedQuestionAudio({
        text: safeText,
        startRecordingAfterPlayback: autoStartListening,
        fallbackToBrowserSpeech: playBrowserQuestionFallback,
      });
    },
    [playBrowserQuestionFallback, playPreparedQuestionAudio, setQuestionAudioMessage]
  );

  const stopQuestionSpeech = useCallback(() => {
    stopPreparedQuestionPlayback();
    stopBrowserQuestionSpeech();
    isSpeakingQuestionRef.current = false;
    setIsSpeakingQuestion(false);
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

  useEffect(() => {
    if (!question || !speakerEnabled) return;

    if (!shouldAutoSpeakQuestions || !hasUserInteracted) {
      if (manualDeviceMode) {
        setQuestionAudioMessage(
          questionAudioReady
            ? "Phone/tablet mode: tap Guided Answer to hear the question and start recording."
            : "Preparing natural question audio..."
        );
      }
      return;
    }

    if (question === lastSpokenQuestionRef.current) return;

    let cancelled = false;

    const autoPlayQuestion = async () => {
      setQuestionAudioMessage(
        "Voice mode selected. Natural question audio will play automatically..."
      );

      const played = await playQuestionWithNaturalAudio(question, true);

      if (cancelled) return;

      if (played) {
        lastSpokenQuestionRef.current = question;
      } else {
        setQuestionAudioMessage(
          "Natural question audio could not auto-play. Use Play Question, or read the question below."
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
    questionAudioReady,
    setQuestionAudioMessage,
    shouldAutoSpeakQuestions,
    speakerEnabled,
  ]);

  useEffect(() => {
    if (!question || !interviewStarted) return;

    if (manualDeviceMode) {
      void prepareQuestionAudio(question);
    }
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
      audioMetrics = defaultAudioMetrics
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
          "Microphone access was not available. Click Start Voice Answer once, then allow microphone access."
        );
      }
    } catch {
      setIsListening(false);
      setGuidedAnswerActive(false);
      recordingStartRef.current = null;
      cleanupAudioMonitoring();
      setQuestionAudioMessage(
        "Microphone access was not available. Click Start Voice Answer once, then allow microphone access."
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

    await wait(450);

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

  const useSavedProfileForRole = useCallback(() => {
    const autofilledRole = buildAutofilledRoleFromProfile(savedCandidateProfile);

    if (!autofilledRole) return;

    roleManuallyEditedRef.current = false;
    setRole(autofilledRole);
    setRoleAutofilledFromProfile(true);
  }, [savedCandidateProfile]);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((previous) => {
      const next = !previous;

      if (!next) {
        setCameraUserStarted(false);
      }

      return next;
    });
    setHasUserInteracted(true);
  }, []);

  const startCameraFromTap = useCallback(() => {
    setHasUserInteracted(true);
    setCameraUserStarted(true);
    setCameraError("");
  }, [setCameraError]);

  const setTextOnlyMode = useCallback(() => {
    setHasUserInteracted(true);
    setSpeakerEnabled(false);
    stopQuestionSpeech();
  }, [stopQuestionSpeech]);

  const setSpeakerMode = useCallback(() => {
    setHasUserInteracted(true);
    setSpeakerEnabled(true);

    if (question) {
      if (manualDeviceMode) {
        if (questionAudioReady) {
          setQuestionAudioMessage("Natural question audio is ready.");
        } else {
          setQuestionAudioMessage("Preparing natural question audio...");
          void prepareQuestionAudio(question);
        }
      } else {
        setQuestionAudioMessage(
          "Voice mode selected. The next question will play automatically."
        );
      }
    }
  }, [
    manualDeviceMode,
    prepareQuestionAudio,
    question,
    questionAudioReady,
    setQuestionAudioMessage,
  ]);

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

    if (speakerEnabled && !manualDeviceMode) {
      if (!voiceSupported) {
        setQuestionAudioMessage(
          "This browser does not support live voice transcription. You can still type your answer."
        );
      } else {
        try {
          setQuestionAudioMessage("Requesting microphone permission for automatic recording...");
          await primeAudioInput();
          setQuestionAudioMessage(
            "Microphone ready. Generating your first question..."
          );
        } catch {
          setQuestionAudioMessage(
            "Microphone permission was not available. You may need to click Start Voice Answer once after the question."
          );
        }
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

    setQuestionAudioMessage(
      manualDeviceMode
        ? "Guided answer starting. Camera will start if enabled, then natural question audio will play."
        : "Guided answer starting. Natural question audio will play, then recording will start."
    );

    await playQuestionWithNaturalAudio(question, true);
  }, [
    cameraEnabled,
    clearCurrentAnswerCapture,
    manualDeviceMode,
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

      let latestVoiceAnalysis = latestVoiceAnalysisRef.current || voiceAnalysis;
      let latestVideoAnalysis = latestVideoAnalysisRef.current || videoAnalysis;

      const transcriptForVoiceAnalysis = stripQuestionLeakageFromTranscript(
        rawAnswerTranscriptRef.current.trim() || answer.trim(),
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
        answer,
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
    question,
    runVideoAnalysis,
    runVoiceAnalysis,
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
  }, [
    cleanupAudioMonitoring,
    cleanupPreparedQuestionAudio,
    clearAudioSamples,
    isListening,
    lastSpokenQuestionRef,
    recognitionRef,
    resetTranscript,
    resetVideoFrames,
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

  const handleRoleChange = useCallback((value: string) => {
    roleManuallyEditedRef.current = true;
    setRoleAutofilledFromProfile(false);
    setRole(value);
  }, []);

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

  const paceFallbackScore =
    latestVoiceAnalysisRef.current?.paceScore ?? voiceAnalysis?.paceScore ?? 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <PracticeHeader isLoaded={isLoaded} isSignedIn={isSignedIn} />

      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
          <PracticeHero totalQuestions={totalQuestions} />

          {!interviewStarted && (
            <PracticeStartScreen
              isLoaded={isLoaded}
              isSignedIn={isSignedIn}
              role={role}
              onRoleChange={handleRoleChange}
              savedCandidateProfile={savedCandidateProfile}
              profileContextLoaded={profileContextLoaded}
              roleAutofilledFromProfile={roleAutofilledFromProfile}
              useSavedProfileForRole={useSavedProfileForRole}
              manualDeviceMode={manualDeviceMode}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              interviewType={interviewType}
              setInterviewType={setInterviewType}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              focusArea={focusArea}
              setFocusArea={setFocusArea}
              speakerEnabled={speakerEnabled}
              cameraEnabled={cameraEnabled}
              setTextOnlyMode={setTextOnlyMode}
              setSpeakerMode={setSpeakerMode}
              toggleCamera={toggleCamera}
              startInterview={startInterview}
              questionLoading={questionLoading}
            />
          )}

          {interviewStarted && !interviewFinished && (
            <>
              <PracticeSessionHeader
                currentQuestionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                averageQuestionScore={averageQuestionScore}
                question={question}
                speakerSupported={speakerSupported}
                speakerEnabled={speakerEnabled}
                cameraEnabled={cameraEnabled}
                manualDeviceMode={manualDeviceMode}
                questionAudioReady={questionAudioReady}
                questionAudioLoading={questionAudioLoading}
                isSpeakingQuestion={activeIsSpeakingQuestion}
                setTextOnlyMode={setTextOnlyMode}
                setSpeakerMode={setSpeakerMode}
                toggleCamera={toggleCamera}
                playQuestionManually={playQuestionManually}
                stopQuestionSpeech={stopQuestionSpeech}
                setQuestionAudioMessage={setQuestionAudioMessage}
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
                <div className="space-y-6">
                  <PracticeCoachPanel
                    role={role}
                    interviewType={interviewType}
                    difficulty={difficulty}
                    focusArea={focusArea}
                    speakerEnabled={speakerEnabled}
                    isSpeakingQuestion={activeIsSpeakingQuestion}
                    manualDeviceMode={manualDeviceMode}
                    isListening={isListening}
                    questionAudioMessage={questionAudioMessage}
                    cameraEnabled={cameraEnabled}
                    cameraRequiresTap={cameraRequiresTap}
                    cameraError={cameraError}
                    cameraReady={cameraReady}
                    startCameraFromTap={startCameraFromTap}
                    videoRef={videoRef}
                    questionLoading={questionLoading}
                    question={question}
                    currentQuestionNumber={currentQuestionNumber}
                    totalQuestions={totalQuestions}
                    speakerSupported={speakerSupported}
                    questionAudioLoading={questionAudioLoading}
                    questionAudioReady={questionAudioReady}
                    guidedAnswerRunning={guidedAnswerRunning}
                    startGuidedAnswer={() => void startGuidedAnswer()}
                    playQuestionManually={playQuestionManually}
                    stopQuestionSpeech={stopQuestionSpeech}
                  />
                </div>

                <div className="xl:sticky xl:top-28 xl:self-start">
                  <PracticeAnswerPanel
                    feedback={feedback}
                    answer={answer}
                    question={question}
                    questionLoading={questionLoading}
                    voiceSupported={voiceSupported}
                    manualDeviceMode={manualDeviceMode}
                    questionAudioLoading={questionAudioLoading}
                    questionAudioReady={questionAudioReady}
                    questionAudioError={questionAudioError}
                    isSpeakingQuestion={activeIsSpeakingQuestion}
                    isListening={isListening}
                    cameraEnabled={cameraEnabled}
                    cleaningTranscript={cleaningTranscript}
                    guidedAnswerRunning={guidedAnswerRunning}
                    feedbackLoading={feedbackLoading}
                    voiceAnalysisLoading={voiceAnalysisLoading}
                    videoAnalysisLoading={videoAnalysisLoading}
                    getFeedback={getFeedback}
                    startGuidedAnswer={() => void startGuidedAnswer()}
                    startVoiceInput={() => void startVoiceInput()}
                    stopVoiceInput={() => void stopVoiceInput()}
                    clearVoiceAnswer={clearVoiceAnswer}
                    onAnswerChange={handleAnswerChange}
                  />
                </div>
              </div>

              <PracticeDeliveryAnalysis
                voiceAnalysis={voiceAnalysis}
                videoAnalysis={videoAnalysis}
              />

              <PracticeFeedbackPanel
                feedback={feedback}
                currentQuestionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                paceFallbackScore={paceFallbackScore}
                nextStep={() => void nextStep()}
              />
            </>
          )}

          {interviewFinished && (
            <PracticeSummaryPanel
              summaryLoading={summaryLoading}
              summary={summary}
              resetInterview={resetInterview}
            />
          )}
        </div>
      </div>
    </main>
  );
}
