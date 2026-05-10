/**
 * Tests for audioMetrics.ts
 *
 * CRITICAL REGRESSION COVERAGE:
 * Long pauses were being detected far too aggressively (threshold: 800 ms).
 * Natural breathing, between-sentence pauses, and microphone gaps were all
 * being flagged, producing messages like "detected 10 long pauses" when the
 * user had none. Threshold raised to 3 000 ms (30 samples × 100 ms each).
 * Feedback injection gated to >= 3 genuine long pauses.
 */

import { describe, it, expect } from "vitest";
import { calculateAudioMetrics } from "../../app/practice/lib/audioMetrics";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a sample array: `voiced` ms of speech followed by `silent` ms of silence,
 *  repeated `cycles` times. Samples are taken every 100 ms. */
function buildSamples(cycles: Array<{ voicedMs: number; silentMs: number }>) {
  const samples: number[] = [];
  for (const { voicedMs, silentMs } of cycles) {
    const voicedCount = Math.round(voicedMs / 100);
    const silentCount = Math.round(silentMs / 100);
    for (let i = 0; i < voicedCount; i++) samples.push(30); // clear speech
    for (let i = 0; i < silentCount; i++) samples.push(2);  // below threshold
  }
  return samples;
}

// ─── longPauseCount thresholds ────────────────────────────────────────────────

describe("calculateAudioMetrics — long pause detection", () => {
  it("does NOT count a 800 ms gap as a long pause (old false-positive threshold)", () => {
    // Previous threshold was 800 ms — natural sentence breaks hit this easily.
    const samples = buildSamples([
      { voicedMs: 2000, silentMs: 800 },  // sentence 1 → 800 ms gap
      { voicedMs: 2000, silentMs: 800 },  // sentence 2 → 800 ms gap
      { voicedMs: 2000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(0); // 800 ms must NOT be a long pause
  });

  it("does NOT count a 2 second gap as a long pause", () => {
    const samples = buildSamples([
      { voicedMs: 3000, silentMs: 2000 },
      { voicedMs: 3000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(0);
  });

  it("does NOT count a 2.9 second gap as a long pause (just under threshold)", () => {
    const samples = buildSamples([
      { voicedMs: 3000, silentMs: 2900 },
      { voicedMs: 3000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(0);
  });

  it("counts a 3 second gap as a long pause (at threshold)", () => {
    const samples = buildSamples([
      { voicedMs: 3000, silentMs: 3000 },
      { voicedMs: 3000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(1);
  });

  it("counts two separate 3+ second gaps correctly", () => {
    const samples = buildSamples([
      { voicedMs: 2000, silentMs: 3500 },
      { voicedMs: 2000, silentMs: 3500 },
      { voicedMs: 2000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(2);
  });

  it("returns zero long pauses for a fluent speech sample", () => {
    // Normal speech: sentences with 400–600 ms natural breaks
    const samples = buildSamples([
      { voicedMs: 4000, silentMs: 400 },
      { voicedMs: 3000, silentMs: 600 },
      { voicedMs: 3500, silentMs: 500 },
      { voicedMs: 4000, silentMs: 300 },
      { voicedMs: 3000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.longPauseCount).toBe(0);
  });

  it("returns zero long pauses for empty samples", () => {
    const metrics = calculateAudioMetrics([]);
    expect(metrics.longPauseCount).toBe(0);
  });
});

// ─── estimatedPauseCount (short pauses ≥ 500 ms) ─────────────────────────────

describe("calculateAudioMetrics — short pause detection (≥ 500 ms)", () => {
  it("counts a 500 ms gap as an estimated pause", () => {
    const samples = buildSamples([
      { voicedMs: 2000, silentMs: 500 },
      { voicedMs: 2000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.estimatedPauseCount).toBeGreaterThanOrEqual(1);
  });

  it("does NOT count a 400 ms gap as an estimated pause (below threshold)", () => {
    const samples = buildSamples([
      { voicedMs: 2000, silentMs: 400 },
      { voicedMs: 2000, silentMs: 0 },
    ]);
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.estimatedPauseCount).toBe(0);
  });
});

// ─── silence / voiced ratios ──────────────────────────────────────────────────

describe("calculateAudioMetrics — silence and voiced ratios", () => {
  it("computes silenceRatio correctly for all-silent input", () => {
    const samples = Array(20).fill(2); // all below threshold
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.silenceRatio).toBe(1);
    expect(metrics.voicedFrameRatio).toBe(0);
  });

  it("computes voicedFrameRatio correctly for all-voiced input", () => {
    const samples = Array(20).fill(40); // all above threshold
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.voicedFrameRatio).toBe(1);
    expect(metrics.silenceRatio).toBe(0);
  });

  it("computes a roughly 50/50 split correctly", () => {
    const samples = [...Array(10).fill(40), ...Array(10).fill(2)];
    const metrics = calculateAudioMetrics(samples);
    expect(metrics.silenceRatio).toBeCloseTo(0.5, 1);
    expect(metrics.voicedFrameRatio).toBeCloseTo(0.5, 1);
  });
});

// ─── feedback injection gate (mirrors feedback/route.ts logic) ────────────────

describe("long pause feedback injection gate", () => {
  // The feedback API only injects the pause improvement when longPauseCount >= 3.
  // This prevents false positives from occasional audio glitches.
  const shouldInjectPauseFeedback = (longPauseCount: number) => longPauseCount >= 3;

  it("does NOT inject feedback for 0 long pauses", () => {
    expect(shouldInjectPauseFeedback(0)).toBe(false);
  });

  it("does NOT inject feedback for 1 long pause (could be a single hesitation)", () => {
    expect(shouldInjectPauseFeedback(1)).toBe(false);
  });

  it("does NOT inject feedback for 2 long pauses", () => {
    expect(shouldInjectPauseFeedback(2)).toBe(false);
  });

  it("injects feedback for 3 long pauses (clear pattern)", () => {
    expect(shouldInjectPauseFeedback(3)).toBe(true);
  });

  it("injects feedback for high counts", () => {
    expect(shouldInjectPauseFeedback(10)).toBe(true);
  });
});
