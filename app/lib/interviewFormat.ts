/**
 * Interview formats.
 *
 * Most candidates aged 18 to 25 meet a one-way video interview before they
 * ever sit across from a person: a question appears, a countdown runs while
 * they think, then a large camera view records the answer with no transcript
 * and no feedback until later. Practising only in our coaching flow left them
 * rehearsing something other than the thing they were about to face.
 *
 * The format is separate from the answer mode (typed, voice, voice with
 * camera): it decides the shape of the session, not the input device. A
 * one-way video interview always uses voice and camera.
 */

export const INTERVIEW_FORMAT_VALUES = ["traditional", "one_way_video"] as const;

export type InterviewFormat = (typeof INTERVIEW_FORMAT_VALUES)[number];

/** Shown on the setup screen, in this order. */
export const INTERVIEW_FORMATS: ReadonlyArray<{
  value: InterviewFormat;
  label: string;
  description: string;
}> = [
  {
    value: "traditional",
    label: "Traditional interview",
    description:
      "A question, your answer, then scored feedback and a model answer before you move on. Best for learning and fixing weak spots.",
  },
  {
    value: "one_way_video",
    label: "One-way video interview",
    description:
      "Time to prepare, then you record your answer to camera with a timer running and no feedback until the end. Best for rehearsing the real thing.",
  },
];

export function normaliseInterviewFormat(value: unknown): InterviewFormat {
  return value === "one_way_video" ? "one_way_video" : "traditional";
}

export function isOneWayVideo(value: unknown): boolean {
  return normaliseInterviewFormat(value) === "one_way_video";
}

/** When feedback is shown in a one-way video interview. */
export type FeedbackTiming = "end" | "each";

export type VideoInterviewSettings = {
  /** Seconds to read and think before recording starts. */
  prepSeconds: number;
  /** Seconds allowed for the answer itself. */
  answerSeconds: number;
  /** Second attempts per question. Employers usually allow none. */
  retakesAllowed: number;
  /** "end" mirrors a real one-way interview; "each" turns it back into coaching. */
  feedbackTiming: FeedbackTiming;
};

/**
 * Defaults match what employers commonly set: about a minute to think and two
 * minutes to answer, one take, nothing back until the end.
 */
export const DEFAULT_VIDEO_SETTINGS: VideoInterviewSettings = {
  prepSeconds: 60,
  answerSeconds: 120,
  retakesAllowed: 0,
  feedbackTiming: "end",
};

/** Only the values the setup screen actually offers are accepted. */
const PREP_CHOICES = [30, 60, 90];
const ANSWER_CHOICES = [60, 120, 180];
const RETAKE_CHOICES = [0, 1];

function pick(value: unknown, allowed: number[], fallback: number): number {
  return typeof value === "number" && allowed.includes(value) ? value : fallback;
}

/**
 * The settings arrive from the browser, so a tampered config must not be able
 * to buy a candidate more preparation time than the format allows.
 */
export function normaliseVideoSettings(value: unknown): VideoInterviewSettings {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<VideoInterviewSettings>;
  return {
    prepSeconds: pick(raw.prepSeconds, PREP_CHOICES, DEFAULT_VIDEO_SETTINGS.prepSeconds),
    answerSeconds: pick(raw.answerSeconds, ANSWER_CHOICES, DEFAULT_VIDEO_SETTINGS.answerSeconds),
    retakesAllowed: pick(raw.retakesAllowed, RETAKE_CHOICES, DEFAULT_VIDEO_SETTINGS.retakesAllowed),
    feedbackTiming: raw.feedbackTiming === "each" ? "each" : DEFAULT_VIDEO_SETTINGS.feedbackTiming,
  };
}

/** The choices the setup screen renders, so the options live in one place. */
export const VIDEO_SETTING_CHOICES = {
  prepSeconds: PREP_CHOICES,
  answerSeconds: ANSWER_CHOICES,
  retakesAllowed: RETAKE_CHOICES,
} as const;
