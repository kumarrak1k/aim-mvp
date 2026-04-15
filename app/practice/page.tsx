"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { MentorPlayer } from "@/components/avatar/mentor-player";

type BrowserSpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternative;
};

type BrowserSpeechRecognitionResultList = {
  length: number;
  [index: number]: BrowserSpeechRecognitionResult;
};

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type CategoryScores = {
  content: number;
  clarity: number;
  relevance: number;
  structure: number;
  confidence: number;
};

type Feedback = {
  overall_score: number;
  category_scores: CategoryScores;
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

type CameraMetrics = {
  faceDetectedRatio: number;
  centeredFaceRatio: number;
  lookingForwardRatio: number;
  postureStabilityScore: number;
  movementVariance: number;
  engagementRatio: number;
  faceLossEvents: number;
};

type VoiceAnalysis = {
  paceScore: number;
  fillerScore: number;
  confidenceScore: number;
  energyScore: number;
  overallVoiceScore: number;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    fillerCount: number;
    fillerRate: number;
    hedgeCount: number;
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
    repeatedPhrasesDetected: string[];
  };
  error?: string;
};

type VideoAnalysis = {
  eyeContactScore: number;
  presenceScore: number;
  postureScore: number;
  engagementScore: number;
  overallVideoScore: number;
  metrics: CameraMetrics;
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
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
};

type InterviewSummary = {
  overall_score: number;
  hire_signal: "Weak" | "Moderate" | "Strong";
  top_strengths: string[];
  top_improvements: string[];
  final_recommendation: string;
  next_steps: string[];
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

type FaceLandmarkerInstance = {
  detectForVideo: (
    videoFrame: HTMLVideoElement,
    timestamp?: number
  ) => {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
  };
  close?: () => void;
};

const defaultVoiceAnalysis: VoiceAnalysis = {
  paceScore: 0,
  fillerScore: 0,
  confidenceScore: 0,
  energyScore: 0,
  overallVoiceScore: 0,
  metrics: {
    wordCount: 0,
    sentenceCount: 0,
    fillerCount: 0,
    fillerRate: 0,
    hedgeCount: 0,
    repetitionCount: 0,
    structureMarkerCount: 0,
    exampleMarkerCount: 0,
    estimatedWPM: 0,
    averageSentenceLength: 0,
    averageVolume: 0,
    peakVolume: 0,
    volumeVariation: 0,
    silenceRatio: 0,
    lowVolumeRatio: 0,
    estimatedPauseCount: 0,
    longPauseCount: 0,
    voicedFrameRatio: 0,
  },
  feedback: {
    strengths: [],
    improvements: [],
  },
  evidence: {
    fillersDetected: [],
    hedgesDetected: [],
    repeatedPhrasesDetected: [],
  },
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

const defaultCameraMetrics: CameraMetrics = {
  faceDetectedRatio: 0,
  centeredFaceRatio: 0,
  lookingForwardRatio: 0,
  postureStabilityScore: 0,
  movementVariance: 1,
  engagementRatio: 0,
  faceLossEvents: 0,
};

function isVoiceAnalysis(value: unknown): value is VoiceAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<VoiceAnalysis>;

  return (
    typeof v.paceScore === "number" &&
    typeof v.fillerScore === "number" &&
    typeof v.confidenceScore === "number" &&
    typeof v.energyScore === "number" &&
    typeof v.overallVoiceScore === "number" &&
    typeof v.metrics === "object" &&
    typeof v.feedback === "object" &&
    typeof v.evidence === "object"
  );
}

function isVideoAnalysis(value: unknown): value is VideoAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<VideoAnalysis>;

  return (
    typeof v.eyeContactScore === "number" &&
    typeof v.presenceScore === "number" &&
    typeof v.postureScore === "number" &&
    typeof v.engagementScore === "number" &&
    typeof v.overallVideoScore === "number" &&
    typeof v.metrics === "object" &&
    typeof v.feedback === "object"
  );
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string"
  ) {
    return (value as { error: string }).error;
  }

  return fallback;
}

export default function PracticePage() {
  const [role, setRole] = useState("");
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
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");

  const recordingStartRef = useRef<number | null>(null);
  const answerDurationSecondsRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const audioSamplesRef = useRef<number[]>([]);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const cameraLoopRef = useRef<number | null>(null);
  const cameraStartInFlightRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const cameraDetectionDisabledRef = useRef(false);

  const cameraMetricsFramesRef = useRef<{
    totalFrames: number;
    faceDetectedFrames: number;
    centeredFrames: number;
    lookingForwardFrames: number;
    engagedFrames: number;
    faceLossEvents: number;
    noFaceRun: number;
    positions: Array<{ x: number; y: number }>;
  }>({
    totalFrames: 0,
    faceDetectedFrames: 0,
    centeredFrames: 0,
    lookingForwardFrames: 0,
    engagedFrames: 0,
    faceLossEvents: 0,
    noFaceRun: 0,
    positions: [],
  });

  const totalQuestions = 5;
  const currentQuestionNumber = results.length + 1;

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
      const speechWindow = window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionConstructor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
      };

      const SpeechRecognitionClass =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-GB";

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          let newFinalText = "";
          let newInterimText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              newFinalText += `${transcriptPart} `;
            } else {
              newInterimText += transcriptPart;
            }
          }

          if (newFinalText) {
            finalTranscriptRef.current =
              `${finalTranscriptRef.current} ${newFinalText}`.trim();
          }

          interimTranscriptRef.current = newInterimText.trim();

          const combined = [finalTranscriptRef.current, interimTranscriptRef.current]
            .filter(Boolean)
            .join(" ")
            .trim();

          setAnswer(combined);
        };

        recognition.onend = () => {
          setIsListening(false);

          const combined = [finalTranscriptRef.current, interimTranscriptRef.current]
            .filter(Boolean)
            .join(" ")
            .trim();

          if (combined) {
            setAnswer(combined);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      cleanupAudioMonitoring();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraEnabled && interviewStarted && videoRef.current) {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [cameraEnabled, interviewStarted]);

  const averageQuestionScore = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce(
      (sum: number, item: ResultItem) => sum + (item.feedback?.overall_score || 0),
      0
    );
    return Math.round((total / results.length) * 10) / 10;
  }, [results]);

  const saveSession = (sessionSummary: InterviewSummary) => {
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      role,
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

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  };

  const resetCameraMetricsFrames = () => {
    cameraMetricsFramesRef.current = {
      totalFrames: 0,
      faceDetectedFrames: 0,
      centeredFrames: 0,
      lookingForwardFrames: 0,
      engagedFrames: 0,
      faceLossEvents: 0,
      noFaceRun: 0,
      positions: [],
    };
    lastVideoTimeRef.current = -1;
    cameraDetectionDisabledRef.current = false;
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
      cameraStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      cameraStreamRef.current = null;
    }

    faceLandmarkerRef.current = null;
    cameraStartInFlightRef.current = false;
    lastVideoTimeRef.current = -1;
    cameraDetectionDisabledRef.current = false;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setCameraError("");
    resetCameraMetricsFrames();
  };

  const waitForVideoReady = async (video: HTMLVideoElement) => {
    if (video.readyState >= 2) {
      return;
    }

    await new Promise<void>((resolve) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("canplay", onLoaded);
        resolve();
      };

      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("canplay", onLoaded);
    });
  };

  const initialiseFaceTracker = async (): Promise<FaceLandmarkerInstance> => {
    if (faceLandmarkerRef.current) {
      return faceLandmarkerRef.current;
    }

    const visionModule = (await import(
      "@mediapipe/tasks-vision"
    )) as FaceTrackerModule;

    const vision = await visionModule.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const landmarker = await visionModule.FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceLandmarkerRef.current = landmarker;
    return landmarker;
  };

  const analyseFaceFrame = (landmarks: Array<{ x: number; y: number; z?: number }>) => {
    const nose = landmarks[1];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const forehead = landmarks[10];
    const chin = landmarks[152];

    if (!nose || !leftEyeOuter || !rightEyeOuter || !forehead || !chin) {
      return;
    }

    const frameState = cameraMetricsFramesRef.current;
    frameState.totalFrames += 1;
    frameState.faceDetectedFrames += 1;

    if (frameState.noFaceRun >= 8) {
      frameState.faceLossEvents += 1;
    }
    frameState.noFaceRun = 0;

    const centerX = nose.x;
    const centerY = nose.y;

    const isCentered =
      centerX > 0.34 && centerX < 0.66 && centerY > 0.22 && centerY < 0.72;

    if (isCentered) {
      frameState.centeredFrames += 1;
    }

    const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
    const faceHeight = Math.abs(chin.y - forehead.y);
    const faceLooksPresent = eyeDistance > 0.12 && faceHeight > 0.2;

    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const noseOffset = Math.abs(nose.x - eyeMidX);
    const lookingForward = noseOffset < 0.035 && isCentered && faceLooksPresent;

    if (lookingForward) {
      frameState.lookingForwardFrames += 1;
    }

    const engaged = isCentered && lookingForward && faceLooksPresent;
    if (engaged) {
      frameState.engagedFrames += 1;
    }

    frameState.positions.push({ x: centerX, y: centerY });
  };

  const calculateCameraMetrics = (): CameraMetrics => {
    const frameState = cameraMetricsFramesRef.current;
    const totalFrames = frameState.totalFrames;

    if (totalFrames === 0) {
      return { ...defaultCameraMetrics };
    }

    const positions = frameState.positions;
    let meanX = 0;
    let meanY = 0;

    positions.forEach((position: { x: number; y: number }) => {
      meanX += position.x;
      meanY += position.y;
    });

    meanX /= positions.length || 1;
    meanY /= positions.length || 1;

    let varianceSum = 0;
    positions.forEach((position: { x: number; y: number }) => {
      const dx = position.x - meanX;
      const dy = position.y - meanY;
      varianceSum += dx * dx + dy * dy;
    });

    const movementVariance = positions.length ? varianceSum / positions.length : 1;
    const postureStabilityScore = Math.max(0, 1 - Math.min(1, movementVariance * 20));

    return {
      faceDetectedRatio: Number((frameState.faceDetectedFrames / totalFrames).toFixed(3)),
      centeredFaceRatio: Number((frameState.centeredFrames / totalFrames).toFixed(3)),
      lookingForwardRatio: Number((frameState.lookingForwardFrames / totalFrames).toFixed(3)),
      postureStabilityScore: Number(postureStabilityScore.toFixed(3)),
      movementVariance: Number(movementVariance.toFixed(4)),
      engagementRatio: Number((frameState.engagedFrames / totalFrames).toFixed(3)),
      faceLossEvents: frameState.faceLossEvents,
    };
  };

  const disableCameraAnalysisOnly = () => {
    cameraDetectionDisabledRef.current = true;
    faceLandmarkerRef.current = null;
    stopCameraLoop();
    setCameraReady(true);
    setCameraError(
      "Camera preview is available, but live face analysis was disabled on this browser/device."
    );
  };

  const startCameraLoop = () => {
    const loop = async () => {
      const videoElement = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (
        cameraDetectionDisabledRef.current ||
        !cameraEnabled ||
        !interviewStarted ||
        !videoElement ||
        !landmarker ||
        videoElement.readyState < 2
      ) {
        if (!cameraDetectionDisabledRef.current) {
          cameraLoopRef.current = window.requestAnimationFrame(() => {
            void loop();
          });
        }
        return;
      }

      try {
        const currentTime = videoElement.currentTime;

        if (currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentTime;

          const result =
            landmarker.detectForVideo.length >= 2
              ? landmarker.detectForVideo(videoElement, Math.round(currentTime * 1000))
              : landmarker.detectForVideo(videoElement);

          const frameState = cameraMetricsFramesRef.current;

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            analyseFaceFrame(result.faceLandmarks[0]);
          } else {
            frameState.totalFrames += 1;
            frameState.noFaceRun += 1;
          }
        }
      } catch {
        disableCameraAnalysisOnly();
        return;
      }

      cameraLoopRef.current = window.requestAnimationFrame(() => {
        void loop();
      });
    };

    cameraLoopRef.current = window.requestAnimationFrame(() => {
      void loop();
    });
  };

  const startCamera = async () => {
    if (!cameraEnabled || !interviewStarted) return;
    if (!videoRef.current) return;
    if (cameraStartInFlightRef.current) return;

    try {
      cameraStartInFlightRef.current = true;
      setCameraError("");

      const videoElement = videoRef.current;

      if (!videoElement) return;

      if (!cameraStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        cameraStreamRef.current = stream;
      }

      if (videoElement.srcObject !== cameraStreamRef.current) {
        videoElement.srcObject = cameraStreamRef.current;
      }

      await waitForVideoReady(videoElement);
      await videoElement.play().catch(() => undefined);

      try {
        await initialiseFaceTracker();
      } catch {
        cameraDetectionDisabledRef.current = true;
        setCameraError(
          "Camera preview is available, but live face analysis could not be started on this browser/device."
        );
      }

      resetCameraMetricsFrames();
      setCameraReady(true);

      if (!cameraDetectionDisabledRef.current) {
        stopCameraLoop();
        startCameraLoop();
      }
    } catch {
      setCameraError("Unable to access the camera. Check browser permission settings.");
      setCameraReady(false);
    } finally {
      cameraStartInFlightRef.current = false;
    }
  };

  const startAudioMonitoring = async () => {
    cleanupAudioMonitoring();
    audioSamplesRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const audioWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };

    const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("AudioContext is not supported in this browser.");
    }

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

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
      samples.reduce((sum: number, value: number) => sum + value, 0) / samples.length;

    const peakVolume = Math.max(...samples);

    const variance =
      samples.reduce(
        (sum: number, value: number) => sum + Math.pow(value - averageVolume, 2),
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

        if (sample < lowVolumeThreshold) {
          lowVolumeFrames += 1;
        }

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

  const startVoiceInput = async () => {
    if (!recognitionRef.current) return;

    try {
      interimTranscriptRef.current = "";
      recordingStartRef.current = Date.now();
      audioSamplesRef.current = [];
      setVideoAnalysis(null);
      setVoiceAnalysis(null);

      if (cameraEnabled) {
        resetCameraMetricsFrames();
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

  const runVoiceAnalysis = async (
    cleanedTranscript: string,
    durationSeconds: number | null,
    audioMetrics: AudioMetrics
  ) => {
    if (!cleanedTranscript.trim()) {
      setVoiceAnalysis(null);
      return null;
    }

    try {
      setVoiceAnalysisLoading(true);

      const res = await fetch("/api/voice-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: cleanedTranscript,
          durationSeconds,
          audioMetrics,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok || !isVoiceAnalysis(data)) {
        const fallback: VoiceAnalysis = {
          ...defaultVoiceAnalysis,
          error: getErrorMessage(data, "Voice analysis failed."),
        };
        setVoiceAnalysis(fallback);
        return fallback;
      }

      setVoiceAnalysis(data);
      return data;
    } catch {
      const fallback: VoiceAnalysis = {
        ...defaultVoiceAnalysis,
        error: "Something went wrong while analysing voice delivery.",
      };
      setVoiceAnalysis(fallback);
      return fallback;
    } finally {
      setVoiceAnalysisLoading(false);
    }
  };

  const runVideoAnalysis = async (cameraMetrics: CameraMetrics | null) => {
    if (!cameraEnabled || !cameraMetrics) {
      setVideoAnalysis(null);
      return null;
    }

    try {
      setVideoAnalysisLoading(true);

      const res = await fetch("/api/video-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cameraMetrics,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok || !isVideoAnalysis(data)) {
        const fallback: VideoAnalysis = {
          eyeContactScore: 0,
          presenceScore: 0,
          postureScore: 0,
          engagementScore: 0,
          overallVideoScore: 0,
          metrics: cameraMetrics,
          feedback: {
            strengths: [],
            improvements: [],
          },
          error: getErrorMessage(data, "Video analysis failed."),
        };
        setVideoAnalysis(fallback);
        return fallback;
      }

      setVideoAnalysis(data);
      return data;
    } catch {
      const fallback: VideoAnalysis = {
        eyeContactScore: 0,
        presenceScore: 0,
        postureScore: 0,
        engagementScore: 0,
        overallVideoScore: 0,
        metrics: cameraMetrics,
        feedback: {
          strengths: [],
          improvements: [],
        },
        error: "Something went wrong while analysing camera engagement.",
      };
      setVideoAnalysis(fallback);
      return fallback;
    } finally {
      setVideoAnalysisLoading(false);
    }
  };

  const ensureDeliveryAnalysisForCurrentAnswer = async () => {
    const transcriptToAnalyse = answer.trim();

    if (!transcriptToAnalyse) {
      return;
    }

    const audioMetrics =
      audioSamplesRef.current.length > 0 ? calculateAudioMetrics() : { ...defaultAudioMetrics };

    const durationSeconds = answerDurationSecondsRef.current;

    await runVoiceAnalysis(transcriptToAnalyse, durationSeconds, audioMetrics);

    if (cameraEnabled) {
      const currentCameraMetrics = calculateCameraMetrics();
      await runVideoAnalysis(currentCameraMetrics);
    } else {
      setVideoAnalysis(null);
    }
  };

  const stopVoiceInput = async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);

    const durationSeconds = recordingStartRef.current
      ? Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
      : null;

    answerDurationSecondsRef.current = durationSeconds;
    recordingStartRef.current = null;

    const audioMetrics = calculateAudioMetrics();
    const cameraMetrics = cameraEnabled ? calculateCameraMetrics() : null;

    cleanupAudioMonitoring();

    if (cameraEnabled) {
      await runVideoAnalysis(cameraMetrics);
    } else {
      setVideoAnalysis(null);
    }

    const combined = [finalTranscriptRef.current, interimTranscriptRef.current]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (combined) {
      setAnswer(combined);
      await cleanTranscript(combined, durationSeconds, audioMetrics);
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
    setIsListening(false);
    setAnswer("");
    setVoiceAnalysis(null);
    setVideoAnalysis(null);
    resetCameraMetricsFrames();
  };

  const cleanTranscript = async (
    rawTranscript: string,
    durationSeconds: number | null = answerDurationSecondsRef.current,
    audioMetrics: AudioMetrics = { ...defaultAudioMetrics }
  ) => {
    if (!rawTranscript.trim()) return;

    try {
      setCleaningTranscript(true);
      setVoiceAnalysis(null);

      const res = await fetch("/api/clean-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: rawTranscript,
        }),
      });

      const data = (await res.json()) as { cleanedTranscript?: string };

      if (res.ok && data.cleanedTranscript) {
        const cleaned = data.cleanedTranscript.trim();
        finalTranscriptRef.current = cleaned;
        interimTranscriptRef.current = "";
        setAnswer(cleaned);
        await runVoiceAnalysis(cleaned, durationSeconds, audioMetrics);
      } else {
        await runVoiceAnalysis(rawTranscript.trim(), durationSeconds, audioMetrics);
      }
    } catch {
      await runVoiceAnalysis(rawTranscript.trim(), durationSeconds, audioMetrics);
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
    setVoiceAnalysisLoading(false);
    setVideoAnalysisLoading(false);
    setCleaningTranscript(false);

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    cleanupAudioMonitoring();

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    resetCameraMetricsFrames();
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
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      recordingStartRef.current = null;
      answerDurationSecondsRef.current = null;
      cleanupAudioMonitoring();
      resetCameraMetricsFrames();

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          questionNumber,
          totalQuestions,
          history: history.map((item: ResultItem) => ({
            question: item.question,
            answer: item.answer,
          })),
        }),
      });

      const data = (await res.json()) as { question?: string; error?: string };

      if (!res.ok || data.error) {
        setQuestion(data.error || "Failed to generate interview question.");
        return;
      }

      setQuestion(data.question || "Tell me about yourself.");
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
    recordingStartRef.current = null;
    answerDurationSecondsRef.current = null;
    resetCameraMetricsFrames();

    await fetchQuestion(1, []);
  };

  const getFeedback = async () => {
    try {
      setHasUserInteracted(true);
      setFeedbackLoading(true);
      setFeedback(null);

      await ensureDeliveryAnalysisForCurrentAnswer();

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });

      const data = (await res.json()) as Feedback;

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

    const updatedResults = [
      ...results,
      { question, answer, feedback, voiceAnalysis, videoAnalysis },
    ];
    setResults(updatedResults);

    if (updatedResults.length >= totalQuestions) {
      setInterviewFinished(true);
      setSummaryLoading(true);

      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            results: updatedResults,
          }),
        });

        const data = (await res.json()) as InterviewSummary;

        if (!res.ok || data.error) {
          const fallbackSummary: InterviewSummary = {
            overall_score: Math.round(
              updatedResults.reduce(
                (sum: number, item: ResultItem) => sum + (item.feedback?.overall_score || 0),
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
              (sum: number, item: ResultItem) => sum + (item.feedback?.overall_score || 0),
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
        finalTranscriptRef.current = "";
        interimTranscriptRef.current = "";
        recordingStartRef.current = null;
        answerDurationSecondsRef.current = null;
        cleanupAudioMonitoring();
        resetCameraMetricsFrames();
      }

      return;
    }

    await fetchQuestion(updatedResults.length + 1, updatedResults);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 text-base font-bold text-white shadow-lg shadow-purple-500/20">
              AI
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                AI Career Mentor
              </p>
              <p className="text-xs text-gray-400">Practice interview</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Home
            </Link>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </header>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
              3D mentor speech prototype
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Practise with a speaking 3D mentor
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              This version restores spoken questions through the 3D mentor and
              lays the path for real viseme lip-sync.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {!interviewStarted && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Enter your profile or target role
                </label>

                <input
                  className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white placeholder-gray-400 outline-none"
                  placeholder="Example: Graduate looking for software engineering placement"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />

                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm text-gray-300">Question delivery:</div>

                  <button
                    type="button"
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(false);
                    }}
                    className={`rounded-xl px-4 py-2 font-semibold transition ${
                      !speakerEnabled
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Text Only
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasUserInteracted(true);
                      setSpeakerEnabled(true);
                    }}
                    className={`rounded-xl px-4 py-2 font-semibold transition ${
                      speakerEnabled
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    3D Mentor + Text
                  </button>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 text-sm text-gray-300">Camera analysis:</div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraEnabled(false);
                      }}
                      className={`rounded-xl px-4 py-2 font-semibold transition ${
                        !cameraEnabled
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Voice Only
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraEnabled(true);
                        setHasUserInteracted(true);
                      }}
                      className={`rounded-xl px-4 py-2 font-semibold transition ${
                        cameraEnabled
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Voice + Camera
                    </button>
                  </div>
                </div>

                <button
                  onClick={startInterview}
                  disabled={!role || questionLoading}
                  className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {questionLoading ? "Starting..." : "Start 5-Question Interview"}
                </button>
              </div>
            )}

            {interviewStarted && !interviewFinished && (
              <>
                <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-purple-300">
                        Question {currentQuestionNumber} of {totalQuestions}
                      </h2>
                      <span className="text-sm text-gray-400">
                        Average score so far: {averageQuestionScore}/10
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHasUserInteracted(true);
                          setSpeakerEnabled(false);
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          !speakerEnabled
                            ? "bg-purple-600 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        Text Only
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHasUserInteracted(true);
                          setSpeakerEnabled(true);
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          speakerEnabled
                            ? "bg-purple-600 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        3D Mentor + Text
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCameraEnabled((previous: boolean) => !previous);
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          cameraEnabled
                            ? "bg-cyan-600 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {cameraEnabled ? "Camera On" : "Camera Off"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <MentorPlayer
                      text={question}
                      enabled={speakerEnabled}
                      autoplay
                      onFinished={() => {
                        if (!isListening) {
                          void startVoiceInput();
                        }
                      }}
                    />

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-cyan-300">Camera Preview</p>
                        <span className="text-xs text-gray-400">
                          {cameraEnabled ? (cameraReady ? "Ready" : "Starting...") : "Off"}
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="h-[460px] w-full object-cover"
                        />
                      </div>

                      {cameraEnabled ? (
                        <p className="mt-2 text-xs text-gray-400">
                          Camera engagement is analysed locally in your browser during your answer.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">
                          Turn camera on to score eye contact, presence, posture, and engagement.
                        </p>
                      )}

                      {cameraError && (
                        <p className="mt-2 text-xs text-red-400">{cameraError}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-400">
                      Interview Question
                    </p>
                    <p className="leading-7 text-gray-100">
                      {questionLoading ? "Generating question..." : question}
                    </p>
                  </div>
                </div>

                {question && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Your answer
                    </label>

                    <textarea
                      className="mb-4 min-h-[180px] w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white placeholder-gray-400 outline-none"
                      placeholder={
                        speakerEnabled
                          ? "The 3D mentor will speak the question, then voice input will begin automatically."
                          : "Write your answer here..."
                      }
                      value={answer}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAnswer(value);
                        finalTranscriptRef.current = value;
                        interimTranscriptRef.current = "";
                        setVoiceAnalysis(null);
                        setVideoAnalysis(null);
                      }}
                    />

                    {voiceSupported && (
                      <div className="mb-4 flex flex-wrap gap-3">
                        {isListening ? (
                          <button
                            onClick={() => {
                              void stopVoiceInput();
                            }}
                            className="rounded-xl bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
                          >
                            Stop Voice Answer
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setHasUserInteracted(true);
                              void startVoiceInput();
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
                          >
                            Start Voice Answer
                          </button>
                        )}

                        <button
                          onClick={clearVoiceAnswer}
                          className="rounded-xl bg-white/10 px-4 py-2 font-semibold hover:bg-white/15"
                        >
                          Clear Voice Answer
                        </button>

                        <span className="self-center text-sm text-gray-400">
                          {isListening
                            ? cameraEnabled
                              ? "Listening with voice + camera analysis..."
                              : "Listening with voice analysis..."
                            : cleaningTranscript
                            ? "Tidying punctuation..."
                            : voiceAnalysisLoading || videoAnalysisLoading
                            ? "Analysing delivery..."
                            : speakerEnabled
                            ? "3D mentor speech is enabled."
                            : "Voice input ready"}
                        </span>
                      </div>
                    )}

                    {!feedback && (
                      <button
                        onClick={() => {
                          void getFeedback();
                        }}
                        disabled={
                          !answer ||
                          feedbackLoading ||
                          cleaningTranscript ||
                          voiceAnalysisLoading ||
                          videoAnalysisLoading
                        }
                        className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {feedbackLoading ? "Evaluating..." : "Get AI Feedback"}
                      </button>
                    )}
                  </div>
                )}

                {feedback && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-2xl font-semibold text-green-300">
                      AI Feedback
                    </h2>

                    {feedback.error ? (
                      <p className="text-red-400">{feedback.error}</p>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-lg font-semibold">
                          Overall score:{" "}
                          <span className="text-yellow-300">
                            {feedback.overall_score}/10
                          </span>
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <ScoreCard label="Content" value={feedback.category_scores.content} />
                          <ScoreCard label="Clarity" value={feedback.category_scores.clarity} />
                          <ScoreCard label="Relevance" value={feedback.category_scores.relevance} />
                          <ScoreCard label="Structure" value={feedback.category_scores.structure} />
                          <ScoreCard label="Confidence" value={feedback.category_scores.confidence} />
                        </div>

                        {voiceAnalysis && !voiceAnalysis.error && (
                          <div className="rounded-2xl border border-cyan-900 bg-cyan-950/30 p-5">
                            <h3 className="mb-4 text-lg font-semibold text-cyan-300">
                              Voice Delivery Analysis
                            </h3>

                            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <ScoreCard label="Voice Score" value={voiceAnalysis.overallVoiceScore} />
                              <ScoreCard label="Pace" value={voiceAnalysis.paceScore} />
                              <ScoreCard label="Confidence" value={voiceAnalysis.confidenceScore} />
                              <ScoreCard label="Energy" value={voiceAnalysis.energyScore} />
                            </div>

                            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <MetricCard label="Words" value={String(voiceAnalysis.metrics.wordCount)} />
                              <MetricCard label="WPM" value={String(voiceAnalysis.metrics.estimatedWPM)} />
                              <MetricCard label="Fillers" value={String(voiceAnalysis.metrics.fillerCount)} />
                              <MetricCard label="Long Pauses" value={String(voiceAnalysis.metrics.longPauseCount)} />
                            </div>
                          </div>
                        )}

                        {videoAnalysis && !videoAnalysis.error && (
                          <div className="rounded-2xl border border-purple-900 bg-purple-950/30 p-5">
                            <h3 className="mb-4 text-lg font-semibold text-purple-300">
                              Camera Engagement Analysis
                            </h3>

                            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                              <ScoreCard label="Video Score" value={videoAnalysis.overallVideoScore} />
                              <ScoreCard label="Eye Contact" value={videoAnalysis.eyeContactScore} />
                              <ScoreCard label="Presence" value={videoAnalysis.presenceScore} />
                              <ScoreCard label="Posture" value={videoAnalysis.postureScore} />
                              <ScoreCard label="Engagement" value={videoAnalysis.engagementScore} />
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-blue-300">
                            Strengths
                          </h3>
                          <ul className="list-disc space-y-1 pl-5 text-gray-200">
                            {feedback.strengths?.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-orange-300">
                            Improvements
                          </h3>
                          <ul className="list-disc space-y-1 pl-5 text-gray-200">
                            {feedback.improvements?.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-purple-300">
                            Improved Answer
                          </h3>
                          <div className="rounded-xl border border-white/10 bg-black/30 p-4 leading-7 text-gray-100">
                            {feedback.improved_answer}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            void nextStep();
                          }}
                          className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500"
                        >
                          {currentQuestionNumber === totalQuestions
                            ? "Finish Interview"
                            : "Next Question"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {interviewFinished && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-3xl font-semibold text-purple-300">
                  Final Interview Summary
                </h2>

                {summaryLoading && <p className="text-gray-400">Generating summary...</p>}

                {summary && (
                  <div className="space-y-6">
                    <p className="text-lg">
                      Final score:{" "}
                      <span className="font-semibold text-yellow-300">
                        {summary.overall_score}/10
                      </span>
                    </p>

                    <p className="text-lg">
                      Hire signal:{" "}
                      <span className="font-semibold text-green-300">
                        {summary.hire_signal}
                      </span>
                    </p>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-blue-300">
                        Top Strengths
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.top_strengths?.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-orange-300">
                        Top Improvements
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.top_improvements?.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-purple-300">
                        Final Recommendation
                      </h3>
                      <p className="text-gray-100">{summary.final_recommendation}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-cyan-300">
                        Next Steps
                      </h3>
                      <ul className="list-disc space-y-1 pl-5 text-gray-200">
                        {summary.next_steps?.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={resetInterview}
                      className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500"
                    >
                      Start New Interview
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-100">3D Mentor Speech</h2>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ 3D avatar scene</p>
                <p>✓ Azure speech playback</p>
                <p>✓ Viseme event timeline collected</p>
                <p>• Morph target mapping needs tuning to your GLB</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-100">
                Session History
              </h2>

              {savedSessions.length === 0 ? (
                <p className="text-sm text-gray-400">No saved sessions yet.</p>
              ) : (
                <div className="space-y-3">
                  {savedSessions.map((session: SavedSession) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <p className="font-semibold text-white">{session.role}</p>
                      <p className="text-sm text-gray-400">{session.date}</p>
                      <p className="mt-2 text-sm text-yellow-300">
                        Score: {session.overallScore}/10
                      </p>
                      <p className="text-sm text-green-300">
                        Hire Signal: {session.hireSignal}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}/10</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}