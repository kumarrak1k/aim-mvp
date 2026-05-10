import type { Feedback, PracticeMode, SpeakerPreference } from "../types";

/** Default question count when none is supplied by config (e.g. classic practice flow). */
export const DEFAULT_TOTAL_QUESTIONS = 5;

/** Hard cap so a malformed config can't request 1000 questions. */
export const MAX_TOTAL_QUESTIONS = 10;
export const MIN_TOTAL_QUESTIONS = 3;

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
  /** Number of questions for this session. Falls back to DEFAULT_TOTAL_QUESTIONS. */
  totalQuestions?: number;
  /**
   * Set when the session is launched from a company assessment invite.
   * Triggers different UX (no "Return to setup" link, redirect to
   * /assessment/[token]/complete on finish) and is forwarded to the
   * practice-sessions API so the assignment row gets marked completed.
   */
  assessmentMode?: boolean;
  assignmentToken?: string;
  /**
   * Company template context — only used in assessmentMode. Replaces the
   * candidate's personal CV/profile so questions are generated purely from
   * what the recruiter configured, keeping the assessment fair and
   * comparable across candidates.
   */
  templateContext?: {
    customInstructions?: string;
    competencyFramework?: string;
    templateName?: string;
    companyName?: string;
    /** Company branding so the in-session chrome feels like the company's
     *  own assessment process, not the generic AI Career Mentor app. */
    companyBrandColor?: string;
    companyLogoUrl?: string;
  };
  createdAt?: string;
  /**
   * When true this session was started on the free plan and must remain
   * in keyboard/typed mode. The session page uses this to keep voice and
   * camera disabled even if they were somehow set in an earlier config.
   */
  freePlan?: boolean;
  /**
   * The practice mode the user explicitly selected on the setup screen.
   * Stored so the session page can gate voice/camera controls correctly
   * even when a paid user chooses "Typed answers only".
   */
  practiceMode?: PracticeMode;
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
  totalQuestions: DEFAULT_TOTAL_QUESTIONS,
};

/** Clamp a candidate questionCount to allowed [3,10] range, defaulting to 5. */
export function clampTotalQuestions(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_TOTAL_QUESTIONS;
  const rounded = Math.round(value);
  if (rounded < MIN_TOTAL_QUESTIONS) return MIN_TOTAL_QUESTIONS;
  if (rounded > MAX_TOTAL_QUESTIONS) return MAX_TOTAL_QUESTIONS;
  return rounded;
}

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
      totalQuestions: clampTotalQuestions(parsed.totalQuestions),
      assessmentMode: Boolean(parsed.assessmentMode),
      assignmentToken:
        typeof parsed.assignmentToken === "string" && parsed.assignmentToken.length > 0
          ? parsed.assignmentToken
          : undefined,
      templateContext:
        parsed.templateContext && typeof parsed.templateContext === "object"
          ? {
              customInstructions:
                typeof parsed.templateContext.customInstructions === "string"
                  ? parsed.templateContext.customInstructions
                  : undefined,
              competencyFramework:
                typeof parsed.templateContext.competencyFramework === "string"
                  ? parsed.templateContext.competencyFramework
                  : undefined,
              templateName:
                typeof parsed.templateContext.templateName === "string"
                  ? parsed.templateContext.templateName
                  : undefined,
              companyName:
                typeof parsed.templateContext.companyName === "string"
                  ? parsed.templateContext.companyName
                  : undefined,
              companyBrandColor:
                typeof parsed.templateContext.companyBrandColor === "string" &&
                /^#[0-9a-fA-F]{6}$/.test(parsed.templateContext.companyBrandColor)
                  ? parsed.templateContext.companyBrandColor
                  : undefined,
              companyLogoUrl:
                typeof parsed.templateContext.companyLogoUrl === "string" &&
                parsed.templateContext.companyLogoUrl.length > 0
                  ? parsed.templateContext.companyLogoUrl
                  : undefined,
            }
          : undefined,
      createdAt:
        typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
      freePlan: Boolean(parsed.freePlan),
      practiceMode:
        parsed.practiceMode === "typed" ||
        parsed.practiceMode === "voice" ||
        parsed.practiceMode === "voice-camera"
          ? parsed.practiceMode
          : undefined,
    };
  } catch {
    return null;
  }
}