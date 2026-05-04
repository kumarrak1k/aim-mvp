import type { Feedback, PracticeMode, SpeakerPreference } from "../types";

export const totalQuestions = 5;

export const PRACTICE_SESSION_CONFIG_KEY = "aim_practice_session_config";

export const defaultSpeakerPreference: SpeakerPreference = {
  voice: "female",
  accent: "british",
  pace: "natural",
};

export type PracticeSessionConfig = {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  speakerPreference: SpeakerPreference;
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
  speakerPreference: defaultSpeakerPreference,
};

export const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

export const speakerVoiceLabels: Record<SpeakerPreference["voice"], string> = {
  female: "Female",
  male: "Male",
  neutral: "Neutral",
};

export const speakerAccentLabels: Record<SpeakerPreference["accent"], string> = {
  british: "British",
  american: "American",
  neutral: "Neutral",
};

export const speakerPaceLabels: Record<SpeakerPreference["pace"], string> = {
  slow: "Slower",
  natural: "Natural",
  energetic: "More energetic",
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

function cleanSpeakerPreference(value: unknown): SpeakerPreference {
  const input = value as Partial<SpeakerPreference> | undefined;

  const voice =
    input?.voice === "female" ||
    input?.voice === "male" ||
    input?.voice === "neutral"
      ? input.voice
      : defaultSpeakerPreference.voice;

  const accent =
    input?.accent === "british" ||
    input?.accent === "american" ||
    input?.accent === "neutral"
      ? input.accent
      : defaultSpeakerPreference.accent;

  const pace =
    input?.pace === "slow" ||
    input?.pace === "natural" ||
    input?.pace === "energetic"
      ? input.pace
      : defaultSpeakerPreference.pace;

  return { voice, accent, pace };
}

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
      speakerPreference: cleanSpeakerPreference(parsed.speakerPreference),
      createdAt:
        typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
    };
  } catch {
    return null;
  }
}