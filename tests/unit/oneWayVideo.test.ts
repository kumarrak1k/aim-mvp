/**
 * The one-way video interview clock.
 *
 * A real one-way interview gives you a fixed time to think and a fixed time to
 * answer, and it takes the answer you have when the clock runs out. Getting
 * that wrong either cuts someone off early or quietly gives them longer than
 * the format allows, so the rules live here rather than inside a component
 * with a setInterval.
 */
import { describe, it, expect } from "vitest";
import {
  startQuestion,
  tick,
  skipPreparation,
  beginRetake,
  canRetake,
  isFinalWarning,
  formatClock,
  FINAL_WARNING_SECONDS,
} from "@/app/practice/session/oneWayVideo";
import { DEFAULT_VIDEO_SETTINGS } from "@/app/lib/interviewFormat";

const SETTINGS = DEFAULT_VIDEO_SETTINGS; // 60s prepare, 120s answer, no retake

describe("one-way video clock", () => {
  it("starts on the preparation countdown", () => {
    const state = startQuestion(SETTINGS);

    expect(state.phase).toBe("preparing");
    expect(state.secondsLeft).toBe(60);
    expect(state.retakesUsed).toBe(0);
  });

  it("counts the preparation time down a second at a time", () => {
    const state = tick(startQuestion(SETTINGS), SETTINGS);

    expect(state.phase).toBe("preparing");
    expect(state.secondsLeft).toBe(59);
  });

  it("starts recording on its own when preparation runs out", () => {
    let state = { ...startQuestion(SETTINGS), secondsLeft: 1 };
    state = tick(state, SETTINGS);

    expect(state.phase).toBe("recording");
    expect(state.secondsLeft).toBe(120);
  });

  it("lets the candidate start early", () => {
    const state = skipPreparation(startQuestion(SETTINGS), SETTINGS);

    expect(state.phase).toBe("recording");
    expect(state.secondsLeft).toBe(120);
  });

  it("does nothing when asked to start early while already recording", () => {
    const recording = skipPreparation(startQuestion(SETTINGS), SETTINGS);
    const again = skipPreparation({ ...recording, secondsLeft: 90 }, SETTINGS);

    expect(again.secondsLeft).toBe(90);
  });

  /**
   * Submitting rather than discarding: an answer cut off mid-sentence is still
   * the answer, and losing it is the worst outcome of a hard limit.
   */
  it("submits the answer when the answer time runs out", () => {
    let state = { ...skipPreparation(startQuestion(SETTINGS), SETTINGS), secondsLeft: 1 };
    state = tick(state, SETTINGS);

    expect(state.phase).toBe("submitting");
    expect(state.secondsLeft).toBe(0);
  });

  it("stops counting once the answer is in", () => {
    const submitted = { phase: "submitting" as const, secondsLeft: 0, retakesUsed: 0 };

    expect(tick(submitted, SETTINGS)).toEqual(submitted);
  });

  it("marks the last thirty seconds of the answer, and nothing else", () => {
    const recording = skipPreparation(startQuestion(SETTINGS), SETTINGS);

    expect(FINAL_WARNING_SECONDS).toBe(30);
    expect(isFinalWarning({ ...recording, secondsLeft: 31 })).toBe(false);
    expect(isFinalWarning({ ...recording, secondsLeft: 30 })).toBe(true);
    expect(isFinalWarning({ ...recording, secondsLeft: 1 })).toBe(true);
    // The preparation countdown is not a deadline to panic about.
    expect(isFinalWarning({ ...startQuestion(SETTINGS), secondsLeft: 10 })).toBe(false);
  });
});

describe("retakes", () => {
  const ONE_RETAKE = { ...DEFAULT_VIDEO_SETTINGS, retakesAllowed: 1 };

  it("offers no retake when the format allows none", () => {
    const submitted = { phase: "submitting" as const, secondsLeft: 0, retakesUsed: 0 };

    expect(canRetake(submitted, DEFAULT_VIDEO_SETTINGS)).toBe(false);
  });

  it("offers one retake when the format allows one", () => {
    const submitted = { phase: "submitting" as const, secondsLeft: 0, retakesUsed: 0 };

    expect(canRetake(submitted, ONE_RETAKE)).toBe(true);
  });

  it("restarts the answer with the full time and spends the retake", () => {
    const submitted = { phase: "submitting" as const, secondsLeft: 0, retakesUsed: 0 };
    const again = beginRetake(submitted, ONE_RETAKE);

    expect(again.phase).toBe("recording");
    expect(again.secondsLeft).toBe(120);
    expect(again.retakesUsed).toBe(1);
    expect(canRetake(again, ONE_RETAKE)).toBe(false);
  });

  it("refuses a retake mid-recording, which would just be a restart", () => {
    const recording = skipPreparation(startQuestion(ONE_RETAKE), ONE_RETAKE);

    expect(canRetake(recording, ONE_RETAKE)).toBe(false);
  });
});

describe("formatClock", () => {
  it("reads as a clock", () => {
    expect(formatClock(120)).toBe("2:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(0)).toBe("0:00");
  });

  it("never shows a negative time", () => {
    expect(formatClock(-5)).toBe("0:00");
  });
});
