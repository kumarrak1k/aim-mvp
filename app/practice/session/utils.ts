import type { Feedback, PracticeMode } from "../types";

export const totalQuestions = 5;

export const PRACTICE_SESSION_CONFIG_KEY = "aim_practice_session_config";

export type PracticeSessionConfig = {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  createdAt?: string;
};

export const defaultSessionConfig: PracticeSessionConfig = {
  role: "",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  speakerEnabled: false,
  cameraEnabled: false,
};

export const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

export const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

export const createFeedbackError = (message: string): Feedback => ({
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

export function parseSessionConfig(): PracticeSessionConfig | null {
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