/**
 * Tests for analysisBuilders.ts
 *
 * Critical coverage:
 * - clampScore must never produce values outside [0, 10]
 * - Pace score boundaries must reflect the documented WPM bands
 * - Filler/hedge detection must be accurate
 */

import { describe, it, expect } from "vitest";
import {
  clampScore,
  buildLocalVoiceAnalysis,
} from "../../app/practice/lib/analysisBuilders";
import type { AudioMetrics } from "../../app/practice/types";

// ─── Neutral audio metrics for tests that don't need to vary audio ────────────

const neutralAudio: AudioMetrics = {
  averageVolume: 40,
  peakVolume: 60,
  volumeVariation: 20,
  silenceRatio: 0.05,
  lowVolumeRatio: 0.05,
  estimatedPauseCount: 2,
  longPauseCount: 0,
  voicedFrameRatio: 0.85,
};

// ─── clampScore ───────────────────────────────────────────────────────────────

describe("clampScore", () => {
  it("returns exactly 0 for zero input", () => {
    expect(clampScore(0)).toBe(0);
  });

  it("returns exactly 10 for 10 input", () => {
    expect(clampScore(10)).toBe(10);
  });

  it("clamps values below 0 to 0", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(-0.001)).toBe(0);
  });

  it("clamps values above 10 to 10", () => {
    expect(clampScore(11)).toBe(10);
    expect(clampScore(100)).toBe(10);
  });

  it("rounds to nearest integer", () => {
    expect(clampScore(7.4)).toBe(7);
    expect(clampScore(7.5)).toBe(8);
    expect(clampScore(7.6)).toBe(8);
  });

  it("handles boundary values precisely", () => {
    expect(clampScore(9.9)).toBe(10);
    expect(clampScore(0.4)).toBe(0);
    expect(clampScore(0.5)).toBe(1);
  });
});

// ─── buildLocalVoiceAnalysis — pace score ─────────────────────────────────────

/**
 * Generates a transcript of approximately the given WPM over the given seconds.
 * Uses single-syllable words so word count is precise.
 */
function makeTranscript(wpm: number, durationSeconds: number): string {
  const wordCount = Math.round((wpm / 60) * durationSeconds);
  return Array.from({ length: wordCount }, (_, i) => (i % 5 === 0 ? "good" : "the")).join(" ");
}

describe("buildLocalVoiceAnalysis — pace score boundaries", () => {
  const dur = 60; // 1 minute makes WPM == word count

  it("scores 9 for WPM in the ideal 120–170 band", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(145, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(9);
  });

  it("scores 7 for WPM just below ideal (100–119)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(110, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(7);
  });

  it("scores 7 for WPM just above ideal (171–190)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(180, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(7);
  });

  it("scores 5 for WPM in slow band (80–99)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(90, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(5);
  });

  it("scores 5 for WPM in fast band (191–220)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(200, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(5);
  });

  it("scores 3 for very slow WPM (< 80)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(50, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(3);
  });

  it("scores 3 for very fast WPM (> 220)", () => {
    const result = buildLocalVoiceAnalysis(makeTranscript(240, dur), dur, neutralAudio);
    expect(result.paceScore).toBe(3);
  });

  it("returns 5 (default) for an empty transcript with no duration", () => {
    const result = buildLocalVoiceAnalysis("", null, neutralAudio);
    // WPM = 0, which hits the >0 guard, so paceScore stays at 5 (default)
    expect(result.paceScore).toBe(5);
  });
});

// ─── buildLocalVoiceAnalysis — filler detection ───────────────────────────────

describe("buildLocalVoiceAnalysis — filler word detection", () => {
  it("counts 'um' fillers accurately", () => {
    const transcript = "um I think um it was um a great idea";
    const result = buildLocalVoiceAnalysis(transcript, 10, neutralAudio);
    expect(result.metrics.fillerCount).toBeGreaterThanOrEqual(3);
    expect(result.evidence.fillersDetected).toContain("um");
  });

  it("counts 'er' fillers but not inside longer words", () => {
    const transcript = "er it was er a performance challenge er";
    const result = buildLocalVoiceAnalysis(transcript, 10, neutralAudio);
    expect(result.evidence.fillersDetected).toContain("er");
    // 'er' inside 'performance' should NOT count
    const countWithoutPerformance = buildLocalVoiceAnalysis("performance was excellent", 10, neutralAudio);
    expect(countWithoutPerformance.metrics.fillerCount).toBe(0);
  });

  it("detects no fillers in a clean professional answer", () => {
    const transcript =
      "In my previous role I managed a team of five nurses and improved patient handover time by twenty percent through structured briefings.";
    const result = buildLocalVoiceAnalysis(transcript, 20, neutralAudio);
    expect(result.metrics.fillerCount).toBe(0);
    expect(result.evidence.fillersDetected).toHaveLength(0);
  });

  it("detects hedge words separately from fillers", () => {
    const transcript = "I sort of think we maybe could possibly do better";
    const result = buildLocalVoiceAnalysis(transcript, 10, neutralAudio);
    expect(result.metrics.hedgeCount).toBeGreaterThan(0);
    expect(result.evidence.hedgesDetected.length).toBeGreaterThan(0);
  });
});

// ─── buildLocalVoiceAnalysis — score clamping ─────────────────────────────────

describe("buildLocalVoiceAnalysis — all scores clamped to [0, 10]", () => {
  const checkClamped = (score: number, label: string) => {
    expect(score, `${label} must be ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(score, `${label} must be ≤ 10`).toBeLessThanOrEqual(10);
  };

  it("clamps all scores for a filler-heavy transcript", () => {
    const transcript = "um um um um um um um um um um um um um um um um um um um um";
    const result = buildLocalVoiceAnalysis(transcript, 5, neutralAudio);
    checkClamped(result.paceScore, "paceScore");
    checkClamped(result.fillerScore, "fillerScore");
    checkClamped(result.confidenceScore, "confidenceScore");
    checkClamped(result.energyScore, "energyScore");
    checkClamped(result.clarityScore ?? 0, "clarityScore");
    checkClamped(result.structureScore ?? 0, "structureScore");
    checkClamped(result.overallVoiceScore, "overallVoiceScore");
  });

  it("clamps all scores for a perfect clean transcript", () => {
    const transcript =
      "First I assessed the situation. Second I communicated clearly with my team. As a result we delivered the project on time.";
    const result = buildLocalVoiceAnalysis(transcript, 8, neutralAudio);
    checkClamped(result.paceScore, "paceScore");
    checkClamped(result.fillerScore, "fillerScore");
    checkClamped(result.confidenceScore, "confidenceScore");
    checkClamped(result.energyScore, "energyScore");
    checkClamped(result.clarityScore ?? 0, "clarityScore");
    checkClamped(result.structureScore ?? 0, "structureScore");
    checkClamped(result.overallVoiceScore, "overallVoiceScore");
  });
});

// ─── buildLocalVoiceAnalysis — word count and WPM ─────────────────────────────

describe("buildLocalVoiceAnalysis — metrics", () => {
  it("counts words correctly", () => {
    const transcript = "One two three four five";
    const result = buildLocalVoiceAnalysis(transcript, 10, neutralAudio);
    expect(result.metrics.wordCount).toBe(5);
  });

  it("calculates WPM from duration", () => {
    // 120 words in 60 seconds = 120 WPM
    const words = Array(120).fill("word").join(" ");
    const result = buildLocalVoiceAnalysis(words, 60, neutralAudio);
    expect(result.metrics.estimatedWPM).toBe(120);
  });

  it("uses fallback duration when null is passed", () => {
    // Should not throw and should produce valid WPM
    const words = Array(40).fill("word").join(" ");
    const result = buildLocalVoiceAnalysis(words, null, neutralAudio);
    expect(result.metrics.estimatedWPM).toBeGreaterThan(0);
  });
});
