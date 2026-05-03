"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

type CategoryScores = {
  content: number;
  clarity: number;
  relevance: number;
  structure: number;
  confidence: number;
};

type SectionFeedbackItem = {
  score: number;
  feedback: string;
  improvement: string;
};

type Feedback = {
  overall_score: number;
  category_scores: CategoryScores;
  pace_score?: number;
  section_feedback?: {
    content: SectionFeedbackItem;
    clarity: SectionFeedbackItem;
    relevance: SectionFeedbackItem;
    structure: SectionFeedbackItem;
    confidence: SectionFeedbackItem;
    pace: SectionFeedbackItem;
  };
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  error?: string;
};

type AudioMetrics = {
  averageVolume: number;
  peakVolume: number;
  volumeVariation: number;
  silenceRatio: number;
  lowVolumeRatio: number;
  estimatedPauseCount: number;
  longPauseCount: number;
  voicedFrameRatio: number;
};

type VoiceAnalysis = {
  paceScore: number;
  fillerScore: number;
  confidenceScore: number;
  energyScore: number;
  clarityScore?: number;
  structureScore?: number;
  overallVoiceScore: number;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    fillerCount: number;
    fillerRate: number;
    hedgeCount: number;
    hedgeRate?: number;
    repetitionCount: number;
    structureMarkerCount: number;
    exampleMarkerCount: number;
    estimatedWPM: number;
    averageSentenceLength: number;
    averageVolume: number;
    peakVolume: number;
    volumeVariation: number;
    silenceRatio: number;
    lowVolumeRatio: number;
    estimatedPauseCount: number;
    longPauseCount: number;
    voicedFrameRatio: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  evidence: {
    fillersDetected: string[];
    hedgesDetected: string[];
  };
  error?: string;
};

type VideoMetrics = {
  faceDetectedRatio: number;
  centeredFaceRatio: number;
  lookingForwardRatio: number;
  postureStabilityScore: number;
  engagementRatio: number;
  expressionScore: number;
  smileRatio: number;
  excessiveMovementScore: number;
  faceLossEvents: number;
  totalFrames: number;
};

type VideoAnalysis = {
  overallVideoScore: number;
  eyeContactScore: number;
  positionScore: number;
  bodyLanguageScore: number;
  expressionScore: number;
  engagementScore: number;
  metrics: VideoMetrics;
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  error?: string;
};

type ResultItem = {
  question: string;
  answer: string;
  feedback: Feedback;
  voiceAnalysis?: VoiceAnalysis | null;
  videoAnalysis?: VideoAnalysis | null;
};

type InterviewSummary = {
  overall_score: number;
  readiness_score?: number;
  hire_signal: "Weak" | "Moderate" | "Strong";
  hire_signal_reason?: string;
  category_breakdown?: {
    content: number;
    clarity: number;
    relevance: number;
    structure: number;
    confidence: number;
    pace: number;
    voice_delivery: number;
    camera_presence: number;
  };
  strongest_answer?: {
    question_number: number;
    question: string;
    score: number;
    reason: string;
  };
  weakest_answer?: {
    question_number: number;
    question: string;
    score: number;
    reason: string;
  };
  voice_delivery_summary?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  camera_delivery_summary?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  top_strengths: string[];
  top_improvements: string[];
  priority_improvements?: string[];
  final_recommendation: string;
  next_steps: string[];
  seven_day_action_plan?: {
    day: string;
    focus: string;
    task: string;
  }[];
  error?: string;
};

type SavedSession = {
  id: string;
  date: string;
  role: string;
  totalQuestions: number;
  overallScore: number;
  hireSignal: string;
};

type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs?: number
  ) => {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    faceBlendshapes?: Array<{
      categories?: Array<{ categoryName: string; score: number }>;
    }>;
  };
  close?: () => void;
};

type FaceTrackerModule = {
  FilesetResolver: {
    forVisionTasks: (wasmPath: string) => Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions: (
      vision: unknown,
      options: Record<string, unknown>
    ) => Promise<FaceLandmarkerInstance>;
  };
};

const defaultAudioMetrics: AudioMetrics = {
  averageVolume: 0,
  peakVolume: 0,
  volumeVariation: 0,
  silenceRatio: 1,
  lowVolumeRatio: 1,
  estimatedPauseCount: 0,
  longPauseCount: 0,
  voicedFrameRatio: 0,
};

const defaultVideoMetrics: VideoMetrics = {
  faceDetectedRatio: 0,
  centeredFaceRatio: 0,
  lookingForwardRatio: 0,
  postureStabilityScore: 0,
  engagementRatio: 0,
  expressionScore: 0,
  smileRatio: 0,
  excessiveMovementScore: 0,
  faceLossEvents: 0,
  totalFrames: 0,
};

const fillerWords = [
  "um",
  "umm",
  "uh",
  "er",
  "erm",
  "ah",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
];

const hedgeWords = [
  "maybe",
  "perhaps",
  "probably",
  "possibly",
  "i think",
  "i guess",
  "i suppose",
  "kind of",
  "sort of",
];

const experienceLevels = [
  "Student / early career",
  "Graduate / entry level",
  "1–3 years experience",
  "3–7 years experience",
  "Senior / experienced professional",
  "Career changer",
  "Returning to work",
];

const interviewTypes = [
  "Competency / behavioural",
  "Graduate scheme",
  "Placement / internship",
  "Career change interview",
  "Leadership interview",
  "Technical interview",
  "Customer service interview",
  "Sales interview",
  "Healthcare / care interview",
  "Administration interview",
  "General professional interview",
];

const difficultyLevels = [
  "Supportive",
  "Standard",
  "Challenging",
  "Strict hiring-bar",
];

const focusAreas = [
  "Balanced",
  "Answer structure",
  "Confidence",
  "Concise communication",
  "STAR examples",
  "Measurable impact",
  "Voice delivery",
  "Camera presence",
  "Filler words",
];

const clampScore = (value: number) => {
  return Math.max(0, Math.min(10, Math.round(value)));
};

const countPhrase = (text: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.match(regex)?.length || 0;
};

const getWords = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
};

const normalizeSpeechGuardText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const speechGuardWords = (text: string) => {
  return normalizeSpeechGuardText(text).split(/\s+/).filter(Boolean);
};

const stripQuestionLeakageFromTranscript = (
  transcript: string,
  activeQuestion: string
) => {
  const rawTranscript = transcript.trim();
  const rawQuestion = activeQuestion.trim();

  if (!rawTranscript || !rawQuestion) return rawTranscript;

  const transcriptWordsRaw = rawTranscript.split(/\s+/);
  const transcriptWordsNormalized = transcriptWordsRaw.map((word) =>
    normalizeSpeechGuardText(word)
  );

  const questionWords = speechGuardWords(rawQuestion);

  if (questionWords.length === 0 || transcriptWordsNormalized.length === 0) {
    return rawTranscript;
  }

  const normalizedTranscript = normalizeSpeechGuardText(rawTranscript);
  const normalizedQuestion = normalizeSpeechGuardText(rawQuestion);

  if (
    normalizedTranscript === normalizedQuestion ||
    normalizedQuestion.includes(normalizedTranscript)
  ) {
    return "";
  }

  let matchingPrefixWords = 0;

  for (
    let index = 0;
    index < Math.min(transcriptWordsNormalized.length, questionWords.length);
    index++
  ) {
    if (transcriptWordsNormalized[index] !== questionWords[index]) {
      break;
    }

    matchingPrefixWords += 1;
  }

  const strongPrefixMatch =
    matchingPrefixWords >= 5 ||
    matchingPrefixWords >= Math.floor(questionWords.length * 0.45);

  if (strongPrefixMatch) {
    return transcriptWordsRaw.slice(matchingPrefixWords).join(" ").trim();
  }

  const transcriptSet = new Set(transcriptWordsNormalized.filter(Boolean));
  const questionSet = new Set(questionWords);

  let overlapCount = 0;

  transcriptSet.forEach((word) => {
    if (questionSet.has(word)) {
      overlapCount += 1;
    }
  });

  const overlapRatio =
    overlapCount / Math.max(1, Math.min(transcriptSet.size, questionSet.size));

  const looksLikeOnlyQuestion =
    transcriptWordsNormalized.length <= questionWords.length + 4 &&
    overlapRatio >= 0.72;

  if (looksLikeOnlyQuestion) {
    return "";
  }

  return rawTranscript;
};

const buildLocalVoiceAnalysis = (
  transcript: string,
  durationSeconds: number | null,
  audioMetrics: AudioMetrics
): VoiceAnalysis => {
  const words = getWords(transcript);
  const wordCount = words.length;

  const safeDuration =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : Math.max(30, Math.round(wordCount / 2));

  const estimatedWPM =
    wordCount > 0 ? Math.round((wordCount / safeDuration) * 60) : 0;

  const sentenceCount = Math.max(
    1,
    transcript.split(/[.!?]+/).filter((part) => part.trim()).length
  );

  const averageSentenceLength =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  const fillerCount = fillerWords.reduce(
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const hedgeCount = hedgeWords.reduce(
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const fillersDetected = fillerWords.filter(
    (word) => countPhrase(transcript, word) > 0
  );

  const hedgesDetected = hedgeWords.filter(
    (word) => countPhrase(transcript, word) > 0
  );

  const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
  const hedgeRate = wordCount > 0 ? hedgeCount / wordCount : 0;

  let paceScore = 5;
  if (estimatedWPM >= 120 && estimatedWPM <= 170) paceScore = 9;
  else if (estimatedWPM >= 100 && estimatedWPM < 120) paceScore = 7;
  else if (estimatedWPM > 170 && estimatedWPM <= 190) paceScore = 7;
  else if (estimatedWPM >= 80 && estimatedWPM < 100) paceScore = 5;
  else if (estimatedWPM > 190 && estimatedWPM <= 220) paceScore = 5;
  else if (estimatedWPM > 0) paceScore = 3;

  const structureMarkers = [
    "first",
    "second",
    "third",
    "finally",
    "for example",
    "as a result",
    "therefore",
    "because",
    "the outcome",
    "the result",
  ];

  const exampleMarkers = [
    "for example",
    "for instance",
    "in my previous role",
    "when i",
    "i worked on",
    "i led",
    "i managed",
    "i delivered",
  ];

  const structureMarkerCount = structureMarkers.reduce(
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const exampleMarkerCount = exampleMarkers.reduce(
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const repetitionCount = words.reduce((sum, word, index) => {
    if (index === 0) return sum;
    return word === words[index - 1] ? sum + 1 : sum;
  }, 0);

  const fillerScore = clampScore(10 - fillerRate * 120 - fillerCount * 0.4);
  const confidenceScore = clampScore(
    8 - hedgeRate * 80 - hedgeCount * 0.35 + Math.min(2, exampleMarkerCount)
  );
  const structureScore = clampScore(
    4 + Math.min(4, structureMarkerCount) + Math.min(2, exampleMarkerCount)
  );
  const energyScore = clampScore(
    5 +
      Math.min(2, audioMetrics.averageVolume / 8) +
      Math.min(2, audioMetrics.volumeVariation / 6) -
      audioMetrics.lowVolumeRatio * 3 -
      audioMetrics.silenceRatio * 2
  );
  const clarityScore = clampScore(
    8 -
      fillerCount * 0.35 -
      repetitionCount * 0.4 -
      audioMetrics.longPauseCount * 0.5 -
      Math.max(0, averageSentenceLength - 28) * 0.1
  );

  const overallVoiceScore = clampScore(
    (paceScore +
      fillerScore +
      confidenceScore +
      energyScore +
      clarityScore +
      structureScore) /
      6
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (paceScore >= 8) strengths.push("Your speaking pace was controlled.");
  else improvements.push("Aim for roughly 120–170 words per minute.");

  if (fillerScore >= 8) strengths.push("You used few filler words.");
  else improvements.push("Reduce filler words such as um, er, like, and you know.");

  return {
    paceScore,
    fillerScore,
    confidenceScore,
    energyScore,
    clarityScore,
    structureScore,
    overallVoiceScore,
    metrics: {
      wordCount,
      sentenceCount,
      fillerCount,
      fillerRate: Number(fillerRate.toFixed(3)),
      hedgeCount,
      hedgeRate: Number(hedgeRate.toFixed(3)),
      repetitionCount,
      structureMarkerCount,
      exampleMarkerCount,
      estimatedWPM,
      averageSentenceLength,
      averageVolume: audioMetrics.averageVolume,
      peakVolume: audioMetrics.peakVolume,
      volumeVariation: audioMetrics.volumeVariation,
      silenceRatio: audioMetrics.silenceRatio,
      lowVolumeRatio: audioMetrics.lowVolumeRatio,
      estimatedPauseCount: audioMetrics.estimatedPauseCount,
      longPauseCount: audioMetrics.longPauseCount,
      voicedFrameRatio: audioMetrics.voicedFrameRatio,
    },
    feedback: {
      strengths,
      improvements,
    },
    evidence: {
      fillersDetected,
      hedgesDetected,
    },
  };
};

const buildFallbackVideoAnalysis = (
  metrics: VideoMetrics,
  reason = "Advanced live face tracking was unavailable on this browser/device, so this is a neutral fallback video score."
): VideoAnalysis => {
  return {
    overallVideoScore: 5,
    eyeContactScore: 5,
    positionScore: 5,
    bodyLanguageScore: 5,
    expressionScore: 5,
    engagementScore: 5,
    metrics,
    feedback: {
      strengths: ["Camera preview was active during the answer."],
      improvements: [reason],
    },
  };
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  const [role, setRole] = useState("");
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

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cleaningTranscript, setCleaningTranscript] = useState(false);

  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const lastSpokenQuestionRef = useRef("");
  const activeQuestionRef = useRef("");
  const isSpeakingQuestionRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const autoStartListeningAfterSpeechRef = useRef(false);

  const latestVoiceAnalysisRef = useRef<VoiceAnalysis | null>(null);
  const latestVideoAnalysisRef = useRef<VideoAnalysis | null>(null);
  const rawAnswerTranscriptRef = useRef("");

  const recordingStartRef = useRef<number | null>(null);
  const answerDurationSecondsRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const audioSamplesRef = useRef<number[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const cameraLoopRef = useRef<number | null>(null);
  const cameraStartInFlightRef = useRef(false);
  const cameraAnalysisDisabledRef = useRef(false);
  const cameraFrameErrorCountRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const mediaPipeTimestampRef = useRef(0);

  const videoFramesRef = useRef({
    totalFrames: 0,
    faceDetectedFrames: 0,
    centeredFrames: 0,
    lookingForwardFrames: 0,
    engagedFrames: 0,
    expressiveFrames: 0,
    smileFrames: 0,
    faceLossEvents: 0,
    noFaceRun: 0,
    positions: [] as Array<{ x: number; y: number }>,
  });

  const totalQuestions = 5;
  const currentQuestionNumber = results.length + 1;

  const candidateProfile = useMemo(() => {
    return `
Target role/profile:
${role.trim()}

Experience level:
${experienceLevel}

Interview type:
${interviewType}

Difficulty:
${difficulty}

Main practice focus:
${focusArea}

Instruction:
Generate questions and feedback that match this candidate context. Use the selected difficulty and focus area when deciding how strict, detailed and challenging to be.
`.trim();
  }, [role, experienceLevel, interviewType, difficulty, focusArea]);

  useEffect(() => {
    const stored = localStorage.getItem("aim_sessions");
    if (stored) {
      try {
        setSavedSessions(JSON.parse(stored));
      } catch {
        setSavedSessions([]);
      }
    }

    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: any) => {
          if (isSpeakingQuestionRef.current) {
            finalTranscriptRef.current = "";
            interimTranscriptRef.current = "";
            setAnswer("");
            return;
          }

          let newFinalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = stripQuestionLeakageFromTranscript(
              event.results[i][0].transcript,
              activeQuestionRef.current
            );

            if (!transcriptPart) continue;

            if (event.results[i].isFinal) {
              newFinalText += transcriptPart + " ";
            } else {
              interimTranscriptRef.current = transcriptPart;
            }
          }

          if (newFinalText) {
            finalTranscriptRef.current = stripQuestionLeakageFromTranscript(
              (finalTranscriptRef.current + " " + newFinalText)
                .replace(/\s+/g, " ")
                .trim(),
              activeQuestionRef.current
            );

            setAnswer(finalTranscriptRef.current);
          }
        };

        recognition.onend = () => {
          setIsListening(false);

          const combined = stripQuestionLeakageFromTranscript(
            [finalTranscriptRef.current, interimTranscriptRef.current]
              .filter(Boolean)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
            activeQuestionRef.current
          );

          finalTranscriptRef.current = combined;
          interimTranscriptRef.current = "";

          if (combined) {
            setAnswer(combined);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      cleanupAudioMonitoring();
      stopCamera();

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    activeQuestionRef.current = question;
  }, [question]);

  useEffect(() => {
    if (
      !question ||
      !speakerEnabled ||
      !hasUserInteracted ||
      question === lastSpokenQuestionRef.current
    ) {
      return;
    }

    speakQuestion(question, true);
    lastSpokenQuestionRef.current = question;
  }, [question, speakerEnabled, hasUserInteracted]);

  useEffect(() => {
    if (cameraEnabled && interviewStarted) {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [cameraEnabled, interviewStarted]);

  const averageQuestionScore = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce(
      (sum, item) => sum + (item.feedback?.overall_score || 0),
      0
    );
    return Math.round((total / results.length) * 10) / 10;
  }, [results]);

  const saveSession = (sessionSummary: InterviewSummary) => {
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      role: `${role} · ${interviewType} · ${difficulty}`,
      totalQuestions,
      overallScore: sessionSummary.overall_score,
      hireSignal: sessionSummary.hire_signal,
    };

    const nextSessions = [newSession, ...savedSessions].slice(0, 8);
    setSavedSessions(nextSessions);
    localStorage.setItem("aim_sessions", JSON.stringify(nextSessions));
  };

  const cleanupAudioMonitoring = () => {
    if (audioIntervalRef.current) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {}
      audioSourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  };

  const resetVideoFrames = () => {
    videoFramesRef.current = {
      totalFrames: 0,
      faceDetectedFrames: 0,
      centeredFrames: 0,
      lookingForwardFrames: 0,
      engagedFrames: 0,
      expressiveFrames: 0,
      smileFrames: 0,
      faceLossEvents: 0,
      noFaceRun: 0,
      positions: [],
    };

    lastVideoTimeRef.current = -1;
    mediaPipeTimestampRef.current = 0;
    cameraFrameErrorCountRef.current = 0;
  };

  const stopCameraLoop = () => {
    if (cameraLoopRef.current) {
      window.cancelAnimationFrame(cameraLoopRef.current);
      cameraLoopRef.current = null;
    }
  };

  const stopCamera = () => {
    stopCameraLoop();

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    faceLandmarkerRef.current = null;
    cameraStartInFlightRef.current = false;
    cameraAnalysisDisabledRef.current = false;
    cameraFrameErrorCountRef.current = 0;
    mediaPipeTimestampRef.current = 0;
    lastVideoTimeRef.current = -1;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setCameraError("");
    resetVideoFrames();
  };

  const waitForVideoReady = async (video: HTMLVideoElement) => {
    if (video.readyState >= 2) return;

    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("loadedmetadata", done);
        video.removeEventListener("canplay", done);
        resolve();
      };

      video.addEventListener("loadedmetadata", done);
      video.addEventListener("canplay", done);
    });
  };

  const initialiseFaceTracker = async () => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;

    const visionModule = (await import(
      "@mediapipe/tasks-vision"
    )) as FaceTrackerModule;

    const vision = await visionModule.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    const landmarker = await visionModule.FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );

    faceLandmarkerRef.current = landmarker;
    return landmarker;
  };

  const analyseFaceFrame = (
    landmarks: Array<{ x: number; y: number; z?: number }>,
    blendshapes?: Array<{ categoryName: string; score: number }>
  ) => {
    const nose = landmarks[1];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const forehead = landmarks[10];
    const chin = landmarks[152];

    if (!nose || !leftEyeOuter || !rightEyeOuter || !forehead || !chin) return;

    const frames = videoFramesRef.current;

    frames.totalFrames += 1;
    frames.faceDetectedFrames += 1;

    if (frames.noFaceRun >= 8) {
      frames.faceLossEvents += 1;
    }

    frames.noFaceRun = 0;

    const centerX = nose.x;
    const centerY = nose.y;

    const isCentered =
      centerX > 0.34 && centerX < 0.66 && centerY > 0.2 && centerY < 0.72;

    if (isCentered) frames.centeredFrames += 1;

    const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
    const faceHeight = Math.abs(chin.y - forehead.y);
    const faceLooksPresent = eyeDistance > 0.12 && faceHeight > 0.2;

    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const noseOffset = Math.abs(nose.x - eyeMidX);
    const lookingForward = noseOffset < 0.04 && isCentered && faceLooksPresent;

    if (lookingForward) frames.lookingForwardFrames += 1;

    const smileLeft =
      blendshapes?.find((item) => item.categoryName === "mouthSmileLeft")
        ?.score ?? 0;
    const smileRight =
      blendshapes?.find((item) => item.categoryName === "mouthSmileRight")
        ?.score ?? 0;
    const browDownLeft =
      blendshapes?.find((item) => item.categoryName === "browDownLeft")
        ?.score ?? 0;
    const browDownRight =
      blendshapes?.find((item) => item.categoryName === "browDownRight")
        ?.score ?? 0;

    const smileScore = (smileLeft + smileRight) / 2;
    const browTension = (browDownLeft + browDownRight) / 2;

    if (smileScore > 0.15) frames.smileFrames += 1;
    if (smileScore > 0.08 || browTension < 0.35) frames.expressiveFrames += 1;

    if (isCentered && lookingForward && faceLooksPresent) {
      frames.engagedFrames += 1;
    }

    frames.positions.push({ x: centerX, y: centerY });
  };

  const calculateVideoMetrics = (): VideoMetrics => {
    const frames = videoFramesRef.current;
    const totalFrames = frames.totalFrames;

    if (totalFrames === 0) {
      return { ...defaultVideoMetrics };
    }

    const positions = frames.positions;
    let meanX = 0;
    let meanY = 0;

    positions.forEach((position) => {
      meanX += position.x;
      meanY += position.y;
    });

    meanX /= positions.length || 1;
    meanY /= positions.length || 1;

    let varianceSum = 0;
    positions.forEach((position) => {
      const dx = position.x - meanX;
      const dy = position.y - meanY;
      varianceSum += dx * dx + dy * dy;
    });

    const movementVariance = positions.length
      ? varianceSum / positions.length
      : 1;

    const postureStabilityScore = Math.max(
      0,
      1 - Math.min(1, movementVariance * 22)
    );

    const excessiveMovementScore = Math.max(
      0,
      1 - Math.min(1, movementVariance * 30)
    );

    return {
      faceDetectedRatio: Number(
        (frames.faceDetectedFrames / totalFrames).toFixed(3)
      ),
      centeredFaceRatio: Number(
        (frames.centeredFrames / totalFrames).toFixed(3)
      ),
      lookingForwardRatio: Number(
        (frames.lookingForwardFrames / totalFrames).toFixed(3)
      ),
      postureStabilityScore: Number(postureStabilityScore.toFixed(3)),
      engagementRatio: Number((frames.engagedFrames / totalFrames).toFixed(3)),
      expressionScore: Number((frames.expressiveFrames / totalFrames).toFixed(3)),
      smileRatio: Number((frames.smileFrames / totalFrames).toFixed(3)),
      excessiveMovementScore: Number(excessiveMovementScore.toFixed(3)),
      faceLossEvents: frames.faceLossEvents,
      totalFrames,
    };
  };

  const startCameraLoop = () => {
    const loop = () => {
      const videoElement = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (
        cameraAnalysisDisabledRef.current ||
        !cameraEnabled ||
        !interviewStarted ||
        !videoElement ||
        !landmarker ||
        videoElement.readyState < 2
      ) {
        if (!cameraAnalysisDisabledRef.current) {
          cameraLoopRef.current = window.requestAnimationFrame(loop);
        }
        return;
      }

      try {
        const currentVideoTime = videoElement.currentTime;

        if (currentVideoTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentVideoTime;

          const rawTimestamp =
            typeof performance !== "undefined"
              ? Math.round(performance.now())
              : Date.now();

          const safeTimestamp = Math.max(
            rawTimestamp,
            mediaPipeTimestampRef.current + 1
          );

          mediaPipeTimestampRef.current = safeTimestamp;

          const result = landmarker.detectForVideo(videoElement, safeTimestamp);

          cameraFrameErrorCountRef.current = 0;

          const frames = videoFramesRef.current;

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            analyseFaceFrame(
              result.faceLandmarks[0],
              result.faceBlendshapes?.[0]?.categories
            );
          } else {
            frames.totalFrames += 1;
            frames.noFaceRun += 1;
          }
        }
      } catch {
        cameraFrameErrorCountRef.current += 1;

        if (cameraFrameErrorCountRef.current >= 8) {
          cameraAnalysisDisabledRef.current = true;
          stopCameraLoop();
          setCameraError(
            "Camera preview is running. Advanced live video tracking is unavailable on this browser/device, so video delivery will use a neutral fallback score."
          );
          return;
        }

        cameraLoopRef.current = window.requestAnimationFrame(loop);
        return;
      }

      cameraLoopRef.current = window.requestAnimationFrame(loop);
    };

    stopCameraLoop();
    cameraLoopRef.current = window.requestAnimationFrame(loop);
  };

  const startCamera = async () => {
    if (!cameraEnabled || !interviewStarted) return;
    if (cameraStartInFlightRef.current) return;

    try {
      cameraStartInFlightRef.current = true;
      setCameraError("");

      if (!cameraStreamRef.current) {
        cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        await waitForVideoReady(videoRef.current);
        await videoRef.current.play().catch(() => undefined);
      }

      try {
        await initialiseFaceTracker();
      } catch {
        cameraAnalysisDisabledRef.current = true;
        setCameraError(
          "Camera preview is running. Advanced live video tracking could not start on this browser/device, so video delivery will use a neutral fallback score."
        );
      }

      resetVideoFrames();
      setCameraReady(true);

      if (!cameraAnalysisDisabledRef.current) {
        startCameraLoop();
      }
    } catch {
      setCameraReady(false);
      setCameraError("Unable to access camera. Check browser permissions.");
    } finally {
      cameraStartInFlightRef.current = false;
    }
  };

  const runVideoAnalysis = async (metrics: VideoMetrics) => {
    try {
      setVideoAnalysisLoading(true);

      if (cameraAnalysisDisabledRef.current || metrics.totalFrames === 0) {
        const fallback = buildFallbackVideoAnalysis(metrics);
        latestVideoAnalysisRef.current = fallback;
        setVideoAnalysis(fallback);
        return fallback;
      }

      const res = await fetch("/api/video-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metrics }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const fallback = buildFallbackVideoAnalysis(
          metrics,
          data.error ||
            "Video scoring could not be completed, so this is a neutral fallback video score."
        );

        latestVideoAnalysisRef.current = fallback;
        setVideoAnalysis(fallback);
        return fallback;
      }

      latestVideoAnalysisRef.current = data;
      setVideoAnalysis(data);
      return data as VideoAnalysis;
    } catch {
      const fallback = buildFallbackVideoAnalysis(
        metrics,
        "Video scoring could not be completed, so this is a neutral fallback video score."
      );

      latestVideoAnalysisRef.current = fallback;
      setVideoAnalysis(fallback);
      return fallback;
    } finally {
      setVideoAnalysisLoading(false);
    }
  };

  const startAudioMonitoring = async () => {
    cleanupAudioMonitoring();
    audioSamplesRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("AudioContext is not supported.");
    }

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    audioSourceRef.current = source;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    analyserRef.current = analyser;

    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    audioIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const centred = (dataArray[i] - 128) / 128;
        sumSquares += centred * centred;
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      const scaledVolume = rms * 100;
      audioSamplesRef.current.push(scaledVolume);
    }, 100);
  };

  const calculateAudioMetrics = (): AudioMetrics => {
    const samples = audioSamplesRef.current;

    if (!samples.length) {
      return { ...defaultAudioMetrics };
    }

    const averageVolume =
      samples.reduce((sum, value) => sum + value, 0) / samples.length;

    const peakVolume = Math.max(...samples);

    const variance =
      samples.reduce(
        (sum, value) => sum + Math.pow(value - averageVolume, 2),
        0
      ) / samples.length;

    const volumeVariation = Math.sqrt(variance);

    const silenceThreshold = 6;
    const lowVolumeThreshold = 12;

    let silenceFrames = 0;
    let lowVolumeFrames = 0;
    let voicedFrames = 0;
    let estimatedPauseCount = 0;
    let longPauseCount = 0;
    let currentSilentRun = 0;

    for (const sample of samples) {
      if (sample < silenceThreshold) {
        silenceFrames += 1;
        currentSilentRun += 1;
      } else {
        voicedFrames += 1;

        if (currentSilentRun >= 3) {
          estimatedPauseCount += 1;
        }

        if (currentSilentRun >= 8) {
          longPauseCount += 1;
        }

        currentSilentRun = 0;
      }

      if (sample >= silenceThreshold && sample < lowVolumeThreshold) {
        lowVolumeFrames += 1;
      }
    }

    if (currentSilentRun >= 3) estimatedPauseCount += 1;
    if (currentSilentRun >= 8) longPauseCount += 1;

    return {
      averageVolume: Number(averageVolume.toFixed(2)),
      peakVolume: Number(peakVolume.toFixed(2)),
      volumeVariation: Number(volumeVariation.toFixed(2)),
      silenceRatio: Number((silenceFrames / samples.length).toFixed(3)),
      lowVolumeRatio: Number((lowVolumeFrames / samples.length).toFixed(3)),
      estimatedPauseCount,
      longPauseCount,
      voicedFrameRatio: Number((voicedFrames / samples.length).toFixed(3)),
    };
  };

  const runVoiceAnalysis = async (
    transcript: string,
    durationSeconds: number | null,
    audioMetrics: AudioMetrics
  ) => {
    if (!transcript.trim()) return null;

    try {
      setVoiceAnalysisLoading(true);

      const res = await fetch("/api/voice-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          durationSeconds,
          audioMetrics,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const fallback = buildLocalVoiceAnalysis(
          transcript,
          durationSeconds,
          audioMetrics
        );

        latestVoiceAnalysisRef.current = fallback;
        setVoiceAnalysis(fallback);
        return fallback;
      }

      latestVoiceAnalysisRef.current = data;
      setVoiceAnalysis(data);
      return data as VoiceAnalysis;
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
  };

  const getPreferredFemaleVoice = () => {
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
  };

  const stopQuestionSpeech = () => {
    autoStartListeningAfterSpeechRef.current = false;
    isSpeakingQuestionRef.current = false;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingQuestion(false);
  };

  const startVoiceInput = async () => {
    if (!recognitionRef.current) return;

    try {
      interimTranscriptRef.current = "";
      audioSamplesRef.current = [];
      recordingStartRef.current = Date.now();
      latestVoiceAnalysisRef.current = null;
      latestVideoAnalysisRef.current = null;
      rawAnswerTranscriptRef.current = "";
      setVoiceAnalysis(null);
      setVideoAnalysis(null);

      if (cameraEnabled) {
        resetVideoFrames();

        if (!cameraReady) {
          await startCamera();
        }
      }

      await startAudioMonitoring();

      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      recordingStartRef.current = null;
      cleanupAudioMonitoring();
    }
  };

  const speakQuestion = (text: string, autoStartListening: boolean) => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis ||
      !text.trim()
    ) {
      if (autoStartListening) {
        void startVoiceInput();
      }
      return;
    }

    stopQuestionSpeech();
    autoStartListeningAfterSpeechRef.current = autoStartListening;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-GB";

    const preferredVoice = getPreferredFemaleVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    const clearTranscriptBeforeAnswer = () => {
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      rawAnswerTranscriptRef.current = "";
      setAnswer("");
    };

    const beginListeningAfterQuestion = () => {
      clearTranscriptBeforeAnswer();
      void startVoiceInput();
    };

    utterance.onstart = () => {
      isSpeakingQuestionRef.current = true;
      setIsSpeakingQuestion(true);
    };

    utterance.onend = () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);

      if (autoStartListeningAfterSpeechRef.current) {
        autoStartListeningAfterSpeechRef.current = false;
        beginListeningAfterQuestion();
      }
    };

    utterance.onerror = () => {
      isSpeakingQuestionRef.current = false;
      setIsSpeakingQuestion(false);

      if (autoStartListeningAfterSpeechRef.current) {
        autoStartListeningAfterSpeechRef.current = false;
        beginListeningAfterQuestion();
      }
    };

    isSpeakingQuestionRef.current = true;
    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceInput = async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);

    await wait(450);

    const durationSeconds = recordingStartRef.current
      ? Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
      : null;

    answerDurationSecondsRef.current = durationSeconds;
    recordingStartRef.current = null;

    const audioMetrics = calculateAudioMetrics();
    const videoMetrics = cameraEnabled ? calculateVideoMetrics() : null;

    cleanupAudioMonitoring();

    if (videoMetrics) {
      await runVideoAnalysis(videoMetrics);
    }

    const rawTranscript = stripQuestionLeakageFromTranscript(
      [finalTranscriptRef.current, interimTranscriptRef.current]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      activeQuestionRef.current
    );

    finalTranscriptRef.current = rawTranscript;
    interimTranscriptRef.current = "";
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

      const cleaned = await cleanTranscript(rawTranscript);
      setAnswer(cleaned || rawTranscript);
    }
  };

  const clearVoiceAnswer = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    cleanupAudioMonitoring();

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
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
  };

  const cleanTranscript = async (rawTranscript: string) => {
    if (!rawTranscript.trim()) return rawTranscript;

    try {
      setCleaningTranscript(true);

      const res = await fetch("/api/clean-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: rawTranscript,
        }),
      });

      const data = await res.json();

      if (res.ok && data.cleanedTranscript) {
        const cleaned = data.cleanedTranscript.trim();
        finalTranscriptRef.current = cleaned;
        interimTranscriptRef.current = "";
        setAnswer(cleaned);
        return cleaned;
      }

      return rawTranscript;
    } catch (error) {
      console.error("Transcript cleanup failed:", error);
      return rawTranscript;
    } finally {
      setCleaningTranscript(false);
    }
  };

  const resetInterview = () => {
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

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    cleanupAudioMonitoring();
    stopQuestionSpeech();
    resetVideoFrames();

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    lastSpokenQuestionRef.current = "";
    activeQuestionRef.current = "";
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    rawAnswerTranscriptRef.current = "";
    latestVoiceAnalysisRef.current = null;
    latestVideoAnalysisRef.current = null;
    setIsListening(false);
  };

  const fetchQuestion = async (questionNumber: number, history: ResultItem[]) => {
    try {
      setQuestionLoading(true);
      setQuestion("");
      setAnswer("");
      setFeedback(null);
      setVoiceAnalysis(null);
      setVideoAnalysis(null);
      latestVoiceAnalysisRef.current = null;
      latestVideoAnalysisRef.current = null;
      rawAnswerTranscriptRef.current = "";
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      recordingStartRef.current = null;
      answerDurationSecondsRef.current = null;
      audioSamplesRef.current = [];
      resetVideoFrames();

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: candidateProfile,
          questionNumber,
          totalQuestions,
          history: history.map((item) => ({
            question: item.question,
            answer: item.answer,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setQuestion(data.error || "Failed to generate interview question.");
        return;
      }

      const nextQuestion = data.question || "Tell me about yourself.";
      activeQuestionRef.current = nextQuestion;
      setQuestion(nextQuestion);
    } catch {
      setQuestion("Something went wrong while generating the question.");
    } finally {
      setQuestionLoading(false);
    }
  };

  const startInterview = async () => {
    setHasUserInteracted(true);
    setInterviewStarted(true);
    setInterviewFinished(false);
    setResults([]);
    setSummary(null);
    setVoiceAnalysis(null);
    setVideoAnalysis(null);
    latestVoiceAnalysisRef.current = null;
    latestVideoAnalysisRef.current = null;
    rawAnswerTranscriptRef.current = "";
    lastSpokenQuestionRef.current = "";
    activeQuestionRef.current = "";
    resetVideoFrames();
    await fetchQuestion(1, []);

    if (cameraEnabled) {
      void startCamera();
    }
  };

  const getFeedback = async () => {
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
            ? calculateAudioMetrics()
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
        latestVideoAnalysis = await runVideoAnalysis(calculateVideoMetrics());
      }

      const safeAnswer = stripQuestionLeakageFromTranscript(
        answer,
        activeQuestionRef.current
      );

      if (safeAnswer !== answer) {
        setAnswer(safeAnswer);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer: safeAnswer,
          voiceAnalysis: latestVoiceAnalysis,
          videoAnalysis: latestVideoAnalysis,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setFeedback({
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
          error: data.error || "Failed to evaluate answer.",
        });
        return;
      }

      setFeedback(data);
    } catch {
      setFeedback({
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
        error: "Something went wrong while getting feedback.",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const nextStep = async () => {
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
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: candidateProfile,
            results: updatedResults,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const fallbackSummary: InterviewSummary = {
            overall_score: Math.round(
              updatedResults.reduce(
                (sum, item) => sum + (item.feedback?.overall_score || 0),
                0
              ) / updatedResults.length
            ),
            hire_signal: "Moderate",
            top_strengths: ["Good effort across the interview"],
            top_improvements: ["Add more structure to answers"],
            final_recommendation: "Keep practicing with clearer examples.",
            next_steps: [
              "Practice STAR-format answers",
              "Use more specific examples",
              "Improve concise delivery",
            ],
            error: "Summary generation partially failed.",
          };
          setSummary(fallbackSummary);
          saveSession(fallbackSummary);
        } else {
          setSummary(data);
          saveSession(data);
        }
      } catch {
        const fallbackSummary: InterviewSummary = {
          overall_score: Math.round(
            updatedResults.reduce(
              (sum, item) => sum + (item.feedback?.overall_score || 0),
              0
            ) / updatedResults.length
          ),
          hire_signal: "Moderate",
          top_strengths: ["Good effort across the interview"],
          top_improvements: ["Add more structure to answers"],
          final_recommendation: "Keep practicing with clearer examples.",
          next_steps: [
            "Practice STAR-format answers",
            "Use more specific examples",
            "Improve concise delivery",
          ],
          error: "Summary generation partially failed.",
        };
        setSummary(fallbackSummary);
        saveSession(fallbackSummary);
      } finally {
        setSummaryLoading(false);
        setQuestion("");
        setAnswer("");
        setFeedback(null);
        setVoiceAnalysis(null);
        setVideoAnalysis(null);
        latestVoiceAnalysisRef.current = null;
        latestVideoAnalysisRef.current = null;
        rawAnswerTranscriptRef.current = "";
        finalTranscriptRef.current = "";
        interimTranscriptRef.current = "";
        activeQuestionRef.current = "";
      }

      return;
    }

    lastSpokenQuestionRef.current = "";
    await fetchQuestion(updatedResults.length + 1, updatedResults);
  };

  const hasRealVideoFrames = (videoAnalysis?.metrics.totalFrames || 0) > 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07030d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-purple-500/25 blur-xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg shadow-purple-950/40">
                <img
                  src="/brand/logo.jpg"
                  alt="AI Career Mentor"
                  className="h-11 w-11 rounded-xl object-contain"
                />
              </div>
            </div>

            <div>
              <p className="text-lg font-black tracking-[-0.03em]">
                AI Career Mentor
              </p>
              <p className="text-xs font-medium text-purple-100/55">
                Interview intelligence platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="hidden rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.1] sm:block">
                Home
              </button>
            </Link>

            {isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                  Sign In
                </button>
              </SignInButton>
            )}

            {isLoaded && isSignedIn && <UserButton />}
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-12">
          <div className="mb-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl md:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-purple-50 shadow-xl shadow-purple-950/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  Voice + video + AI interview feedback
                </div>

                <h1 className="max-w-4xl text-3xl font-black leading-[1.02] tracking-[-0.045em] md:text-5xl">
                  Practise your next interview with{" "}
                  <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                    precision coaching.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl leading-7 text-gray-300">
                  Complete a focused 5-question mock interview and receive
                  strict hiring-bar feedback across your answers, voice delivery,
                  camera presence, confidence, pace and structure.
                </p>
              </div>

              <div className="grid min-w-[260px] grid-cols-3 gap-3">
                <MiniStat value={String(totalQuestions)} label="Questions" />
                <MiniStat value="360°" label="Feedback" />
                <MiniStat value="8+" label="Target" />
              </div>
            </div>
          </div>

          {!interviewStarted && (
            <div className="grid gap-6 lg:grid-cols-[2fr_0.9fr]">
              <GlassCard>
                <div className="mb-6">
                  <p className="mb-2 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                    Start interview
                  </p>
                  <h2 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">
                    Build a tailored mock interview.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    Set your role, experience level and interview focus so the
                    AI coach can generate sharper questions and judge your
                    answers against the right bar.
                  </p>
                </div>

                <label className="mb-2 block text-sm font-bold text-gray-200">
                  Target role or profile
                </label>

                <input
                  className="mb-5 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                  placeholder="Example: Graduate looking for a software engineering placement"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />

                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Experience level"
                    value={experienceLevel}
                    onChange={setExperienceLevel}
                    options={experienceLevels}
                  />

                  <SelectField
                    label="Interview type"
                    value={interviewType}
                    onChange={setInterviewType}
                    options={interviewTypes}
                  />

                  <SelectField
                    label="Difficulty"
                    value={difficulty}
                    onChange={setDifficulty}
                    options={difficultyLevels}
                  />

                  <SelectField
                    label="Main focus"
                    value={focusArea}
                    onChange={setFocusArea}
                    options={focusAreas}
                  />
                </div>

                <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                  <p className="mb-3 text-sm font-bold text-gray-300">
                    Practice settings
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <ToggleButton
                      active={!speakerEnabled}
                      onClick={() => {
                        setHasUserInteracted(true);
                        setSpeakerEnabled(false);
                        stopQuestionSpeech();
                      }}
                    >
                      Text Only
                    </ToggleButton>

                    <ToggleButton
                      active={speakerEnabled}
                      onClick={() => {
                        setHasUserInteracted(true);
                        setSpeakerEnabled(true);
                      }}
                    >
                      Speaker + Text
                    </ToggleButton>

                    <ToggleButton
                      active={cameraEnabled}
                      onClick={() => {
                        setCameraEnabled((previous) => !previous);
                        setHasUserInteracted(true);
                      }}
                    >
                      {cameraEnabled ? "Camera On" : "Camera Off"}
                    </ToggleButton>
                  </div>
                </div>

                <button
                  onClick={startInterview}
                  disabled={!role.trim() || questionLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 text-base font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {questionLoading
                    ? "Starting..."
                    : "Start Tailored 5-Question Interview"}
                </button>
              </GlassCard>

              <aside className="space-y-6">
                <GlassCard>
                  <h2 className="mb-4 text-xl font-black text-white">
                    Account
                  </h2>

                  {isLoaded && !isSignedIn && (
                    <>
                      <p className="mb-4 text-sm leading-6 text-gray-400">
                        Sign in to prepare for saved accounts, progress tracking
                        and future premium reports.
                      </p>
                      <SignInButton mode="modal">
                        <button className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                          Sign In
                        </button>
                      </SignInButton>
                    </>
                  )}

                  {isLoaded && isSignedIn && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300">
                        You are signed in.
                      </p>
                      <UserButton />
                    </div>
                  )}
                </GlassCard>

                <GlassCard>
                  <h2 className="mb-4 text-xl font-black text-white">
                    Premium setup
                  </h2>
                  <div className="space-y-3 text-sm leading-6 text-gray-400">
                    <CheckItem>{experienceLevel}</CheckItem>
                    <CheckItem>{interviewType}</CheckItem>
                    <CheckItem>{difficulty} difficulty</CheckItem>
                    <CheckItem>Focus: {focusArea}</CheckItem>
                  </div>
                </GlassCard>
              </aside>
            </div>
          )}

          {interviewStarted && !interviewFinished && (
            <>
              <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-1 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                    Question {currentQuestionNumber} of {totalQuestions}
                  </p>
                  <h2 className="text-2xl font-black tracking-[-0.03em]">
                    Interview practice session
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Average score so far: {averageQuestionScore}/10
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ToggleButton
                    active={!speakerEnabled}
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(false);
                      stopQuestionSpeech();
                    }}
                  >
                    Text Only
                  </ToggleButton>

                  <ToggleButton
                    active={speakerEnabled}
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(true);
                      if (question) {
                        speakQuestion(question, true);
                      }
                    }}
                  >
                    Speaker + Text
                  </ToggleButton>

                  <ToggleButton
                    active={cameraEnabled}
                    onClick={() => {
                      setCameraEnabled((previous) => !previous);
                      setHasUserInteracted(true);
                    }}
                  >
                    {cameraEnabled ? "Camera On" : "Camera Off"}
                  </ToggleButton>

                  {speakerEnabled && question && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasUserInteracted(true);
                        if (isSpeakingQuestion) {
                          stopQuestionSpeech();
                        } else {
                          speakQuestion(question, true);
                        }
                      }}
                      className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      {isSpeakingQuestion ? "Stop Voice" : "Play Question"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                  <GlassCard>
                    <div className="mb-5 rounded-[1.5rem] border border-purple-300/15 bg-purple-300/10 p-4">
                      <div className="grid gap-2 text-xs font-bold text-gray-300 sm:grid-cols-2">
                        <p>
                          <span className="text-gray-500">Role:</span>{" "}
                          {role || "Not set"}
                        </p>
                        <p>
                          <span className="text-gray-500">Type:</span>{" "}
                          {interviewType}
                        </p>
                        <p>
                          <span className="text-gray-500">Difficulty:</span>{" "}
                          {difficulty}
                        </p>
                        <p>
                          <span className="text-gray-500">Focus:</span>{" "}
                          {focusArea}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/30 p-5">
                      <div className="grid gap-5 lg:grid-cols-[auto_1fr_260px] lg:items-center">
                        <div className="relative mx-auto flex h-34 w-34 items-center justify-center rounded-[2rem] bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 p-2 shadow-2xl shadow-purple-950/40 lg:mx-0">
                          <div
                            className={`absolute inset-0 rounded-[2rem] ${
                              isSpeakingQuestion
                                ? "animate-ping bg-purple-400/30"
                                : ""
                            }`}
                          />
                          <div className="relative rounded-[1.5rem] bg-white p-2 shadow-xl shadow-black/20">
                            <img
                              src="/brand/logo.jpg"
                              alt="AI Career Coach"
                              className="h-24 w-24 rounded-[1.1rem] object-contain"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-3xl font-black leading-tight tracking-[-0.04em] text-white">
                            AI Career Coach
                          </p>
                          <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
                            {speakerEnabled
                              ? isSpeakingQuestion
                                ? "Reading the question aloud. Your answer will start after the coach finishes."
                                : isListening
                                ? "Listening now. Keep speaking naturally and finish your answer before requesting feedback."
                                : "Ready to guide your mock interview."
                              : "Read the question, answer naturally, then request strict hiring-bar feedback."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                              {speakerEnabled ? "Speaker enabled" : "Text mode"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                              {cameraEnabled ? "Camera enabled" : "Camera off"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
                              {focusArea}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-[1.35rem] border border-white/10 bg-black/45 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                              Camera
                            </p>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-gray-300">
                              {cameraEnabled
                                ? cameraError
                                  ? "Preview"
                                  : cameraReady
                                  ? "Ready"
                                  : "Starting"
                                : "Off"}
                            </span>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              className="h-36 w-full object-cover"
                            />
                          </div>

                          <p className="mt-2 text-[11px] leading-4 text-gray-500">
                            {cameraEnabled
                              ? cameraError
                                ? "Preview active. Scoring uses fallback if tracking is unavailable."
                                : "Tracking eye contact, posture and presence."
                              : "Camera analysis off."}
                          </p>
                        </div>
                      </div>

                      {cameraError && (
                        <p className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
                          {cameraError}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[1.6rem] border border-purple-300/20 bg-purple-300/10 p-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
                          Current Question
                        </p>
                        <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-black text-gray-300">
                          {currentQuestionNumber}/{totalQuestions}
                        </span>
                      </div>
                      <p className="text-lg font-bold leading-8 text-white">
                        {questionLoading ? "Generating question..." : question}
                      </p>
                    </div>
                  </GlassCard>
                </div>

                <div className="xl:sticky xl:top-28 xl:self-start">
                  <GlassCard>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-black uppercase tracking-[0.2em] text-purple-300">
                        Your answer
                      </label>

                      {!feedback && (
                        <button
                          onClick={getFeedback}
                          disabled={
                            !answer ||
                            feedbackLoading ||
                            cleaningTranscript ||
                            isSpeakingQuestion ||
                            voiceAnalysisLoading ||
                            videoAnalysisLoading
                          }
                          className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {feedbackLoading ? "Evaluating..." : "Get AI Feedback"}
                        </button>
                      )}
                    </div>

                    <div className="mb-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        Question reminder
                      </p>
                      <p className="text-sm font-semibold leading-6 text-gray-100">
                        {questionLoading ? "Generating question..." : question}
                      </p>
                    </div>

                    <textarea
                      className="mb-5 min-h-[330px] w-full rounded-2xl border border-white/10 bg-black/35 p-4 leading-7 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                      placeholder={
                        speakerEnabled
                          ? "Once the question finishes, speak naturally. Click Stop Voice Answer when you’re done."
                          : "Write your answer here..."
                      }
                      value={answer}
                      onChange={(e) => {
                        const value = e.target.value;
                        const safeValue = stripQuestionLeakageFromTranscript(
                          value,
                          activeQuestionRef.current
                        );

                        setAnswer(safeValue);
                        finalTranscriptRef.current = safeValue;
                        interimTranscriptRef.current = "";
                        rawAnswerTranscriptRef.current = safeValue;
                        latestVoiceAnalysisRef.current = null;
                        latestVideoAnalysisRef.current = null;
                        setVoiceAnalysis(null);
                        setVideoAnalysis(null);
                      }}
                    />

                    {voiceSupported && (
                      <div className="mb-5 flex flex-wrap gap-3">
                        {isListening ? (
                          <button
                            onClick={stopVoiceInput}
                            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-red-950/20 transition hover:bg-red-600"
                          >
                            Stop Voice Answer
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setHasUserInteracted(true);
                              void startVoiceInput();
                            }}
                            className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-purple-950/30 transition hover:opacity-95"
                          >
                            Start Voice Answer
                          </button>
                        )}

                        <button
                          onClick={clearVoiceAnswer}
                          className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-gray-200 transition hover:bg-white/[0.1]"
                        >
                          Clear Answer
                        </button>
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-sm leading-6 text-gray-400">
                        {isSpeakingQuestion
                          ? "Question is being read aloud..."
                          : isListening
                          ? cameraEnabled
                            ? "Listening… keep speaking naturally. Voice and video are being measured."
                            : "Listening… keep speaking naturally."
                          : cleaningTranscript
                          ? "Tidying transcript and punctuation..."
                          : voiceAnalysisLoading || videoAnalysisLoading
                          ? "Analysing delivery..."
                          : speakerEnabled
                          ? "Question voice will auto-start recording when it finishes."
                          : "Voice input ready."}
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </div>

              {(voiceAnalysis || videoAnalysis) && (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {voiceAnalysis && !voiceAnalysis.error && (
                    <AnalysisPanel title="Voice Analysis" accent="cyan">
                      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <ScoreCard
                          label="Voice"
                          value={voiceAnalysis.overallVoiceScore}
                        />
                        <ScoreCard label="Pace" value={voiceAnalysis.paceScore} />
                        <ScoreCard
                          label="Fillers"
                          value={voiceAnalysis.fillerScore}
                        />
                        <ScoreCard
                          label="Confidence"
                          value={voiceAnalysis.confidenceScore}
                        />
                        <ScoreCard
                          label="Energy"
                          value={voiceAnalysis.energyScore}
                        />
                        <ScoreCard
                          label="Structure"
                          value={voiceAnalysis.structureScore ?? 0}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                          label="Words"
                          value={String(voiceAnalysis.metrics.wordCount)}
                        />
                        <MetricCard
                          label="WPM"
                          value={String(voiceAnalysis.metrics.estimatedWPM)}
                        />
                        <MetricCard
                          label="Fillers"
                          value={String(voiceAnalysis.metrics.fillerCount)}
                        />
                        <MetricCard
                          label="Long pauses"
                          value={String(voiceAnalysis.metrics.longPauseCount)}
                        />
                      </div>
                    </AnalysisPanel>
                  )}

                  {videoAnalysis && !videoAnalysis.error && (
                    <AnalysisPanel title="Video Analysis" accent="purple">
                      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <ScoreCard
                          label="Video"
                          value={videoAnalysis.overallVideoScore}
                        />
                        <ScoreCard
                          label="Eye Contact"
                          value={videoAnalysis.eyeContactScore}
                        />
                        <ScoreCard
                          label="Position"
                          value={videoAnalysis.positionScore}
                        />
                        <ScoreCard
                          label="Body Lang."
                          value={videoAnalysis.bodyLanguageScore}
                        />
                        <ScoreCard
                          label="Expression"
                          value={videoAnalysis.expressionScore}
                        />
                        <ScoreCard
                          label="Engagement"
                          value={videoAnalysis.engagementScore}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                          label="Face detected"
                          value={
                            hasRealVideoFrames
                              ? `${Math.round(
                                  videoAnalysis.metrics.faceDetectedRatio * 100
                                )}%`
                              : "N/A"
                          }
                        />
                        <MetricCard
                          label="Centered"
                          value={
                            hasRealVideoFrames
                              ? `${Math.round(
                                  videoAnalysis.metrics.centeredFaceRatio * 100
                                )}%`
                              : "N/A"
                          }
                        />
                        <MetricCard
                          label="Looking forward"
                          value={
                            hasRealVideoFrames
                              ? `${Math.round(
                                  videoAnalysis.metrics.lookingForwardRatio *
                                    100
                                )}%`
                              : "N/A"
                          }
                        />
                        <MetricCard
                          label="Face loss"
                          value={
                            hasRealVideoFrames
                              ? String(videoAnalysis.metrics.faceLossEvents)
                              : "N/A"
                          }
                        />
                      </div>

                      {videoAnalysis.feedback.improvements.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 font-black text-orange-300">
                            Video improvements
                          </p>
                          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-200">
                            {videoAnalysis.feedback.improvements.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </AnalysisPanel>
                  )}
                </div>
              )}

              {feedback && (
                <GlassCard className="mt-6">
                  <h2 className="mb-5 text-2xl font-black tracking-[-0.03em] text-white">
                    AI Feedback
                  </h2>

                  {feedback.error ? (
                    <p className="text-red-300">{feedback.error}</p>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-[1.6rem] border border-white/10 bg-black/35 p-5">
                        <p className="text-sm text-gray-400">Overall score</p>
                        <p className="mt-1 text-5xl font-black tracking-[-0.05em] text-white">
                          {feedback.overall_score}
                          <span className="text-xl text-gray-500">/10</span>
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <ScoreCard
                          label="Content"
                          value={feedback.category_scores.content}
                        />
                        <ScoreCard
                          label="Clarity"
                          value={feedback.category_scores.clarity}
                        />
                        <ScoreCard
                          label="Relevance"
                          value={feedback.category_scores.relevance}
                        />
                        <ScoreCard
                          label="Structure"
                          value={feedback.category_scores.structure}
                        />
                        <ScoreCard
                          label="Confidence"
                          value={feedback.category_scores.confidence}
                        />
                        <ScoreCard
                          label="Pace"
                          value={
                            feedback.pace_score ??
                            latestVoiceAnalysisRef.current?.paceScore ??
                            voiceAnalysis?.paceScore ??
                            0
                          }
                        />
                      </div>

                      {feedback.section_feedback && (
                        <div>
                          <h3 className="mb-3 text-lg font-black text-cyan-300">
                            Section-by-section feedback
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            <SectionFeedbackCard
                              title="Content"
                              item={feedback.section_feedback.content}
                            />
                            <SectionFeedbackCard
                              title="Clarity"
                              item={feedback.section_feedback.clarity}
                            />
                            <SectionFeedbackCard
                              title="Relevance"
                              item={feedback.section_feedback.relevance}
                            />
                            <SectionFeedbackCard
                              title="Structure"
                              item={feedback.section_feedback.structure}
                            />
                            <SectionFeedbackCard
                              title="Confidence"
                              item={feedback.section_feedback.confidence}
                            />
                            <SectionFeedbackCard
                              title="Pace"
                              item={feedback.section_feedback.pace}
                            />
                          </div>
                        </div>
                      )}

                      <FeedbackList
                        title="Strengths"
                        color="text-blue-300"
                        items={feedback.strengths}
                      />

                      <FeedbackList
                        title="Improvements"
                        color="text-orange-300"
                        items={feedback.improvements}
                      />

                      <div>
                        <h3 className="mb-3 text-lg font-black text-purple-300">
                          Model Answer — 8+/10 Standard
                        </h3>
                        <div className="rounded-2xl border border-white/10 bg-black/35 p-5 leading-8 text-gray-100">
                          {feedback.improved_answer}
                        </div>
                      </div>

                      <button
                        onClick={nextStep}
                        className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
                      >
                        {currentQuestionNumber === totalQuestions
                          ? "Finish Interview"
                          : "Next Question"}
                      </button>
                    </div>
                  )}
                </GlassCard>
              )}
            </>
          )}

          {interviewFinished && (
            <GlassCard>
              <h2 className="mb-5 text-3xl font-black tracking-[-0.04em]">
                Final Interview Summary
              </h2>

              {summaryLoading && (
                <p className="text-gray-400">Generating summary...</p>
              )}

              {summary && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <p className="text-sm text-gray-400">Final score</p>
                      <p className="mt-1 text-5xl font-black tracking-[-0.05em]">
                        {summary.overall_score}
                        <span className="text-xl text-gray-500">/10</span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <p className="text-sm text-gray-400">Hire signal</p>
                      <p className="mt-3 text-3xl font-black text-green-300">
                        {summary.hire_signal}
                      </p>
                    </div>
                  </div>

                  {typeof summary.readiness_score === "number" && (
                    <div className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-5">
                      <p className="text-sm text-gray-400">
                        Interview readiness
                      </p>
                      <p className="mt-1 text-4xl font-black tracking-[-0.05em]">
                        {summary.readiness_score}
                        <span className="text-lg text-gray-500">/10</span>
                      </p>
                      {summary.hire_signal_reason && (
                        <p className="mt-3 leading-7 text-gray-300">
                          {summary.hire_signal_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {summary.category_breakdown && (
                    <div>
                      <h3 className="mb-3 text-lg font-black text-cyan-300">
                        Category Breakdown
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <ScoreCard
                          label="Content"
                          value={summary.category_breakdown.content}
                        />
                        <ScoreCard
                          label="Clarity"
                          value={summary.category_breakdown.clarity}
                        />
                        <ScoreCard
                          label="Relevance"
                          value={summary.category_breakdown.relevance}
                        />
                        <ScoreCard
                          label="Structure"
                          value={summary.category_breakdown.structure}
                        />
                        <ScoreCard
                          label="Confidence"
                          value={summary.category_breakdown.confidence}
                        />
                        <ScoreCard
                          label="Pace"
                          value={summary.category_breakdown.pace}
                        />
                        <ScoreCard
                          label="Voice"
                          value={summary.category_breakdown.voice_delivery}
                        />
                        <ScoreCard
                          label="Camera"
                          value={summary.category_breakdown.camera_presence}
                        />
                      </div>
                    </div>
                  )}

                  <FeedbackList
                    title="Top Strengths"
                    color="text-blue-300"
                    items={summary.top_strengths}
                  />

                  <FeedbackList
                    title="Top Improvements"
                    color="text-orange-300"
                    items={summary.top_improvements}
                  />

                  {summary.priority_improvements && (
                    <FeedbackList
                      title="Top 3 Priority Improvements"
                      color="text-purple-300"
                      items={summary.priority_improvements}
                    />
                  )}

                  <div>
                    <h3 className="mb-2 text-lg font-black text-purple-300">
                      Final Recommendation
                    </h3>
                    <p className="leading-8 text-gray-100">
                      {summary.final_recommendation}
                    </p>
                  </div>

                  <FeedbackList
                    title="Next Steps"
                    color="text-cyan-300"
                    items={summary.next_steps}
                  />

                  {summary.seven_day_action_plan && (
                    <div>
                      <h3 className="mb-3 text-lg font-black text-purple-300">
                        7-Day Action Plan
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {summary.seven_day_action_plan.map((day) => (
                          <div
                            key={day.day}
                            className="rounded-2xl border border-white/10 bg-black/35 p-4"
                          >
                            <p className="font-black text-white">
                              {day.day}: {day.focus}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-gray-400">
                              {day.task}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={resetInterview}
                    className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
                  >
                    Start New Interview
                  </button>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </main>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl md:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-200">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#0b0712]">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
        active
          ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 text-white shadow-lg shadow-purple-950/30"
          : "border border-white/10 bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-2xl font-black tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{label}</p>
    </div>
  );
}

function AnalysisPanel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "cyan" | "purple";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 ${
        accent === "cyan"
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-purple-300/20 bg-purple-300/10"
      }`}
    >
      <h3
        className={`mb-4 text-lg font-black ${
          accent === "cyan" ? "text-cyan-300" : "text-purple-300"
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <h3 className={`mb-2 text-lg font-black ${color}`}>{title}</h3>
      <ul className="list-disc space-y-1 pl-5 leading-7 text-gray-200">
        {items?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="text-purple-300">✓</span>
      <span>{children}</span>
    </p>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {value}
        <span className="text-sm text-gray-500">/10</span>
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionFeedbackCard({
  title,
  item,
}: {
  title: string;
  item: SectionFeedbackItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-xl shadow-black/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-black text-white">{title}</h4>
        <span className="rounded-full bg-purple-300/15 px-3 py-1 text-sm font-black text-purple-200">
          {item.score}/10
        </span>
      </div>
      <p className="mb-3 text-sm leading-6 text-gray-300">{item.feedback}</p>
      <p className="text-sm leading-6 text-orange-200">
        <span className="font-black">Improve: </span>
        {item.improvement}
      </p>
    </div>
  );
}