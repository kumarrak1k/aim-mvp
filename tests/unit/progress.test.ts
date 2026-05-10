/**
 * Tests for buildCategoryAverages (extracted from app/progress/page.tsx).
 *
 * CRITICAL REGRESSION COVERAGE:
 * This module caused the "Pace 3/10 for typed sessions" bug.
 * The root cause: old typed sessions had stale non-zero pace values and the
 * original code only filtered zeros, not the practiceMode flag.
 *
 * These tests ensure that regression can never silently re-appear.
 */

import { describe, it, expect } from "vitest";
import {
  buildCategoryAverages,
  type DashboardSessionForAverages,
} from "../../app/progress/lib/buildCategoryAverages";

// ─── helpers ──────────────────────────────────────────────────────────────────

const typedSession = (scores: {
  content?: number;
  pace?: number;
  voice_delivery?: number;
  camera_presence?: number;
} = {}): DashboardSessionForAverages => ({
  practiceMode: "typed",
  summary: {
    category_breakdown: {
      content: scores.content ?? 7,
      clarity: 7,
      relevance: 7,
      structure: 7,
      confidence: 7,
      pace: scores.pace,            // deliberately set to test gating
      voice_delivery: scores.voice_delivery,
      camera_presence: scores.camera_presence,
    },
  },
});

const voiceSession = (pace = 8, voiceDelivery = 7): DashboardSessionForAverages => ({
  practiceMode: "voice",
  summary: {
    category_breakdown: {
      content: 7,
      clarity: 7,
      relevance: 7,
      structure: 7,
      confidence: 7,
      pace,
      voice_delivery: voiceDelivery,
      camera_presence: undefined,   // no camera for voice-only
    },
  },
});

const cameraSession = (pace = 8, cameraPresence = 9): DashboardSessionForAverages => ({
  practiceMode: "voice-camera",
  summary: {
    category_breakdown: {
      content: 7,
      clarity: 7,
      relevance: 7,
      structure: 7,
      confidence: 7,
      pace,
      voice_delivery: 7,
      camera_presence: cameraPresence,
    },
  },
});

// ─── core mode gating — the regression tests ─────────────────────────────────

describe("buildCategoryAverages — typed sessions NEVER get pace/voice scores", () => {
  it("returns pace = 0 for a typed session even if a stale pace value exists", () => {
    // The bug: old data had pace: 3 saved against typed sessions.
    // The fix: check practiceMode === 'typed' and skip voiceOnly categories.
    const sessions = [typedSession({ pace: 3 })];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(0);
  });

  it("returns voice_delivery = 0 for a typed session even if stale value exists", () => {
    const sessions = [typedSession({ voice_delivery: 5 })];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.voice_delivery).toBe(0);
  });

  it("still calculates content/clarity/etc for typed sessions", () => {
    const sessions = [typedSession({ content: 8 })];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.content).toBe(8);
    expect(averages.clarity).toBe(7);
  });

  it("count for pace is 0 for typed sessions", () => {
    const sessions = [typedSession({ pace: 3 })];
    const { counts } = buildCategoryAverages(sessions);
    expect(counts.pace).toBe(0);
  });
});

describe("buildCategoryAverages — voice sessions DO get pace/voice scores", () => {
  it("includes pace for a voice session", () => {
    const sessions = [voiceSession(8, 7)];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(8);
    expect(averages.voice_delivery).toBe(7);
  });

  it("does NOT include camera_presence for a voice-only session", () => {
    const sessions = [voiceSession()];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.camera_presence).toBe(0);
  });
});

describe("buildCategoryAverages — voice-camera sessions get all scores", () => {
  it("includes pace, voice_delivery, AND camera_presence", () => {
    const sessions = [cameraSession(8, 9)];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(8);
    expect(averages.camera_presence).toBe(9);
  });
});

// ─── averaging across multiple sessions ──────────────────────────────────────

describe("buildCategoryAverages — multi-session averaging", () => {
  it("averages pace across two voice sessions", () => {
    const sessions = [voiceSession(6, 7), voiceSession(10, 7)];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(8); // (6 + 10) / 2
  });

  it("ignores typed sessions when averaging pace", () => {
    // voice session pace=8, typed session with stale pace=2
    // Result should be just 8 (typed ignored), not (8+2)/2=5
    const sessions = [voiceSession(8), typedSession({ pace: 2 })];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(8);
  });

  it("correctly mixes typed and voice for shared categories", () => {
    // content: typed=6, voice=10 → average = 8
    const sessions = [typedSession({ content: 6 }), voiceSession()];
    const { averages } = buildCategoryAverages(sessions);
    // both sessions have content=7 and 6 respectively... voiceSession has content=7
    // typedSession content=6, voiceSession content=7 → (6+7)/2 = 6.5
    expect(averages.content).toBe(6.5);
  });

  it("rounds averages to 1 decimal place", () => {
    // pace: 7 + 8 + 9 = 24 / 3 = 8.0
    const sessions = [voiceSession(7), voiceSession(8), voiceSession(9)];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(8);
  });
});

// ─── edge cases ──────────────────────────────────────────────────────────────

describe("buildCategoryAverages — edge cases", () => {
  it("returns all zeros for an empty session list", () => {
    const { averages } = buildCategoryAverages([]);
    expect(averages.pace).toBe(0);
    expect(averages.content).toBe(0);
    expect(averages.camera_presence).toBe(0);
  });

  it("ignores sessions with no summary", () => {
    const sessions: DashboardSessionForAverages[] = [
      { practiceMode: "voice", summary: undefined },
    ];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(0);
  });

  it("ignores sessions with no category_breakdown", () => {
    const sessions: DashboardSessionForAverages[] = [
      { practiceMode: "voice", summary: { category_breakdown: undefined } },
    ];
    const { averages } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(0);
  });

  it("ignores zero values in breakdown (zero is not a real score)", () => {
    const sessions: DashboardSessionForAverages[] = [
      {
        practiceMode: "voice",
        summary: { category_breakdown: { pace: 0, content: 0 } },
      },
    ];
    const { averages, counts } = buildCategoryAverages(sessions);
    expect(averages.pace).toBe(0);
    expect(counts.pace).toBe(0); // 0 values don't count toward the denominator
  });

  it("data count tracks how many sessions contributed to each category", () => {
    const sessions = [
      voiceSession(8),   // contributes to pace
      voiceSession(6),   // contributes to pace
      typedSession(),    // does NOT contribute to pace
    ];
    const { counts } = buildCategoryAverages(sessions);
    expect(counts.pace).toBe(2);
    expect(counts.content).toBe(3); // all 3 sessions have content
  });
});
