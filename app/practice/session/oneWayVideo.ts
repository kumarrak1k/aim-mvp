/**
 * The clock for a one-way video interview.
 *
 * An employer's one-way interview gives a fixed time to read and think, then a
 * fixed time to record, and takes whatever answer exists when the clock runs
 * out. These rules sit here, away from the component that renders them, so the
 * behaviour can be proved without a setInterval and a camera.
 *
 * Every function is pure: the page holds the state and ticks it once a second.
 */

import type { VideoInterviewSettings } from "@/app/lib/interviewFormat";

export type VideoPhase =
  /** Question on screen, countdown running, nothing is being recorded yet. */
  | "preparing"
  /** Recording. The answer timer is running. */
  | "recording"
  /** Time is up or the candidate finished: the answer is being handed over. */
  | "submitting";

export type VideoStageState = {
  phase: VideoPhase;
  secondsLeft: number;
  retakesUsed: number;
};

/** How much of the answer time is marked as running out. */
export const FINAL_WARNING_SECONDS = 30;

export function startQuestion(settings: VideoInterviewSettings): VideoStageState {
  return { phase: "preparing", secondsLeft: settings.prepSeconds, retakesUsed: 0 };
}

/**
 * One second passing. Reaching zero moves the interview on by itself: that is
 * the whole point of the format, and a candidate who runs out of preparation
 * time still has to answer.
 */
export function tick(state: VideoStageState, settings: VideoInterviewSettings): VideoStageState {
  if (state.phase === "submitting") return state;

  const secondsLeft = state.secondsLeft - 1;
  if (secondsLeft > 0) return { ...state, secondsLeft };

  if (state.phase === "preparing") {
    return { ...state, phase: "recording", secondsLeft: settings.answerSeconds };
  }

  // The answer is submitted rather than discarded, so a sentence cut off in the
  // middle is still scored.
  return { ...state, phase: "submitting", secondsLeft: 0 };
}

/** "I'm ready" — start recording before the preparation time is up. */
export function skipPreparation(
  state: VideoStageState,
  settings: VideoInterviewSettings
): VideoStageState {
  if (state.phase !== "preparing") return state;
  return { ...state, phase: "recording", secondsLeft: settings.answerSeconds };
}

/**
 * A retake is a second attempt at an answer already given, so it is offered
 * once the answer is in. Mid-recording it would just be a restart, which no
 * employer platform allows.
 */
export function canRetake(state: VideoStageState, settings: VideoInterviewSettings): boolean {
  return state.phase === "submitting" && state.retakesUsed < settings.retakesAllowed;
}

export function beginRetake(
  state: VideoStageState,
  settings: VideoInterviewSettings
): VideoStageState {
  if (!canRetake(state, settings)) return state;
  return {
    phase: "recording",
    secondsLeft: settings.answerSeconds,
    retakesUsed: state.retakesUsed + 1,
  };
}

/** True while the answer time is running out, so the UI can say so. */
export function isFinalWarning(state: VideoStageState): boolean {
  return state.phase === "recording" && state.secondsLeft <= FINAL_WARNING_SECONDS;
}

/** Seconds as a clock, e.g. 65 -> "1:05". */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}
