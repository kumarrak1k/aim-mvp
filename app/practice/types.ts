export type PracticeMode = "typed" | "voice" | "voice-camera";

export type SpeakerVoice = "female" | "male" | "neutral";
export type SpeakerAccent = "british" | "american" | "neutral";
export type SpeakerPace = "slow" | "natural" | "energetic";

export type SpeakerPreference = {
  voice: SpeakerVoice;
  accent: SpeakerAccent;
  pace: SpeakerPace;
};

export type CategoryScores = {
  content: number;
  clarity: number;
  relevance: number;
  structure: number;
  confidence: number;
};

export type SectionFeedbackItem = {
  score: number;
  feedback: string;
  improvement: string;
};

export type Feedback = {
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

export type AudioMetrics = {
  averageVolume: number;
  peakVolume: number;
  volumeVariation: number;
  silenceRatio: number;
  lowVolumeRatio: number;
  estimatedPauseCount: number;
  longPauseCount: number;
  voicedFrameRatio: number;
};

export type VoiceAnalysis = {
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

export type VideoMetrics = {
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

export type VideoAnalysis = {
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

export type ResultItem = {
  question: string;
  answer: string;
  feedback: Feedback;
  voiceAnalysis?: VoiceAnalysis | null;
  videoAnalysis?: VideoAnalysis | null;
};

export type InterviewSummary = {
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

export type SavedSession = {
  id: string;
  date: string;
  role: string;
  totalQuestions: number;
  overallScore: number;
  hireSignal: string;
};

export type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  preferredPracticeMode: PracticeMode;
  speakerPreference: SpeakerPreference;
  updatedAt: string;
};

export type FaceLandmarkerInstance = {
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

export type FaceTrackerModule = {
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