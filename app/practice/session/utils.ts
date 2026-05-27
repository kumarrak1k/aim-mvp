import type { Feedback, PracticeMode, SpeakerPreference } from "../types";

/** Default question count when none is supplied by config (e.g. classic practice flow). */
export const DEFAULT_TOTAL_QUESTIONS = 5;

/** Hard cap so a malformed config can't request 1000 questions. */
export const MAX_TOTAL_QUESTIONS = 10;
export const MIN_TOTAL_QUESTIONS = 3;

// ── Question mix (Advanced plan only) ────────────────────────────────────────

export type QuestionMixKey =
  | "opener"      // "Tell me about yourself" style opening question (AI-generated)
  | "competency"
  | "technical"
  | "leadership"
  | "motivation"
  | "situational"
  | "commercial"
  | "custom";     // User-typed verbatim question (bypasses AI generation)

/** Per-type question count breakdown chosen by the candidate. */
export type QuestionMix = Record<QuestionMixKey, number>;

/** Order in which types are sequenced within the session. */
export const QUESTION_TYPE_ORDER: QuestionMixKey[] = [
  "opener",
  "competency",
  "technical",
  "leadership",
  "motivation",
  "situational",
  "commercial",
  "custom",
];

export const QUESTION_TYPE_LABELS: Record<QuestionMixKey, string> = {
  opener: "Tell me about yourself",
  competency: "Competency / Behavioural",
  technical: "Technical",
  leadership: "Leadership",
  motivation: "Motivation for the role",
  situational: "Situational",
  commercial: "Commercial awareness",
  custom: "Custom question",
};

/** Hard cap on characters per user-typed custom question. */
export const MAX_CUSTOM_QUESTION_LENGTH = 500;

/** Sum of all type counts. */
export function mixTotal(mix: QuestionMix): number {
  return QUESTION_TYPE_ORDER.reduce((sum, k) => sum + (mix[k] ?? 0), 0);
}

/**
 * Returns the human-readable question type label for position `questionNumber`
 * (1-based) given a mix definition, or an empty string if the mix has no
 * allocation for that position.
 * Custom slots return "" — they bypass AI generation entirely.
 */
export function getQuestionTypeAtPosition(
  mix: QuestionMix,
  questionNumber: number
): string {
  const sequence: QuestionMixKey[] = [];
  for (const key of QUESTION_TYPE_ORDER) {
    for (let i = 0; i < (mix[key] ?? 0); i++) {
      sequence.push(key);
    }
  }
  const type = sequence[questionNumber - 1];
  if (!type || type === "custom") return "";
  return QUESTION_TYPE_LABELS[type];
}

/**
 * For positions that map to a "custom" slot, returns the 0-based index into
 * the `customQuestions` array.  Returns -1 for all other question types.
 */
export function getCustomQuestionIndex(
  mix: QuestionMix,
  questionNumber: number
): number {
  const sequence: QuestionMixKey[] = [];
  for (const key of QUESTION_TYPE_ORDER) {
    for (let i = 0; i < (mix[key] ?? 0); i++) {
      sequence.push(key);
    }
  }
  const type = sequence[questionNumber - 1];
  if (type !== "custom") return -1;
  return sequence.slice(0, questionNumber - 1).filter((k) => k === "custom").length;
}

/** Validate and clamp each mix value. Total is NOT enforced here (UI does that). */
export function cleanQuestionMix(value: unknown): QuestionMix | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const mix: QuestionMix = {
    opener: 0,
    competency: 0,
    technical: 0,
    leadership: 0,
    motivation: 0,
    situational: 0,
    commercial: 0,
    custom: 0,
  };
  let hasAny = false;
  for (const key of QUESTION_TYPE_ORDER) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      mix[key] = Math.min(Math.round(v), MAX_TOTAL_QUESTIONS);
      if (mix[key] > 0) hasAny = true;
    }
  }
  return hasAny ? mix : undefined;
}

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
  /**
   * When set, this practice session is Stage 2 of an Assessment Centre session.
   * After completion the session page will POST results to the assessment centre
   * API and redirect to /assessment-centre/[id]/stage-3.
   */
  assessmentCentreId?: string;
  /**
   * Advanced plan only. When set, questions are generated in the specified
   * type order (opener → competency → technical → leadership → motivation → …).
   * When absent the interviewType string drives question style as before.
   */
  questionMix?: QuestionMix;
  /**
   * Advanced plan only. Verbatim text for each "custom" slot in questionMix,
   * in order. The nth custom slot in the session sequence maps to
   * customQuestions[n]. These bypass AI generation and are played directly.
   */
  customQuestions?: string[];
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
      assessmentCentreId:
        typeof parsed.assessmentCentreId === "string" && parsed.assessmentCentreId.length > 0
          ? parsed.assessmentCentreId
          : undefined,
      questionMix: cleanQuestionMix(parsed.questionMix),
      customQuestions: Array.isArray(parsed.customQuestions)
        ? (parsed.customQuestions as unknown[])
            .filter((q): q is string => typeof q === "string")
            .map((q) => q.slice(0, MAX_CUSTOM_QUESTION_LENGTH).trim())
            .filter(Boolean)
        : undefined,
    };
  } catch {
    return null;
  }
}