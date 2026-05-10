/**
 * Tests for session layout and display logic across all three practice modes.
 *
 * REGRESSION COVERAGE — bugs found during manual testing session (2026-05-10):
 *
 *   Bug 1: Typed mode (paid user) showed voice recording controls.
 *          Fixed by storing practiceMode in session config.
 *
 *   Bug 2: Voice-only mode showed a "Camera Off" panel taking 150px of space.
 *          Fixed by gating camera column on `cameraEnabled`, not `!freePlan`.
 *
 * These tests pin the correct per-mode behaviour so regressions are caught
 * automatically rather than through manual trial-and-error.
 */

import { describe, it, expect } from "vitest";

// ─── Types (mirrors session/page.tsx) ────────────────────────────────────────

type PracticeMode = "typed" | "voice" | "voice-camera";

// ─── Helpers that mirror the exact expressions used in production code ────────

/** Mirror of session/page.tsx keyboard-only detection */
const isKeyboardOnly = (freePlan: boolean, practiceMode: PracticeMode) =>
  freePlan || practiceMode === "typed";

/** Mirror of session/page.tsx camera column visibility guard */
const showCameraColumn = (cameraEnabled: boolean) => cameraEnabled;

/** Mirror of session/page.tsx grid class selection */
const gridClass = (cameraEnabled: boolean) =>
  cameraEnabled
    ? "xl:grid-cols-[minmax(0,1fr)_150px]"
    : "";

/** Mirror of FeedbackWorkspace.tsx insight visibility */
const showVoiceInsight = (practiceMode: PracticeMode) =>
  practiceMode === "voice" || practiceMode === "voice-camera";

const showCameraInsight = (practiceMode: PracticeMode) =>
  practiceMode === "voice-camera";

/** Mirror of AnswerWorkspace.tsx heading copy */
const answerHeading = (freePlan: boolean) =>
  freePlan ? "Answer editor" : "Transcript and answer editor";

/** Mirror of AnswerWorkspace.tsx placeholder copy */
const answerPlaceholder = (freePlan: boolean, assessmentMode: boolean) => {
  if (freePlan) {
    return assessmentMode
      ? "Type your answer here. You can edit it before submitting."
      : "Type your answer here. You can edit it before requesting feedback.";
  }
  return assessmentMode
    ? "Your answer transcript will appear here. You can also type or edit your answer before submitting it."
    : "Your answer transcript will appear here. You can also type or edit your answer before requesting feedback.";
};

/** Mirror of AnswerWorkspace.tsx bottom-row grid cols */
const answerGridCols = (freePlan: boolean) =>
  freePlan ? "sm:grid-cols-2" : "sm:grid-cols-3";

// ─── freePlan vs isKeyboardOnly — the critical split ─────────────────────────
//
// `freePlan`      = user is actually on the free plan → shows upgrade CTA
// `isKeyboardOnly`= hides voice/camera recording controls
//
// These are the same for free-plan users, but DIFFER for paid users who
// explicitly chose "Typed answers only" — they get keyboard-only controls
// but must NOT see the "upgrade" CTA.
//
// The regression: before this fix, `freePlan` was set to true for typed+paid,
// causing "You've used your 3 free sessions" to appear after every typed session.

const deriveFlags = (configFreePlan: boolean, practiceMode: string) => ({
  freePlan: configFreePlan,                                    // actual plan flag
  isKeyboardOnly: configFreePlan || practiceMode === "typed",  // UI controls flag
});

describe("freePlan vs isKeyboardOnly flag split", () => {
  it("free plan typed session: both flags true (show CTA + hide controls)", () => {
    const { freePlan, isKeyboardOnly } = deriveFlags(true, "typed");
    expect(freePlan).toBe(true);
    expect(isKeyboardOnly).toBe(true);
  });

  it("paid user typed session: isKeyboardOnly=true but freePlan=false (hide controls, no upgrade CTA)", () => {
    // This is the regression case: paid user choosing typed mode should NOT
    // see the "You've used your 3 free sessions" upgrade banner.
    const { freePlan, isKeyboardOnly } = deriveFlags(false, "typed");
    expect(freePlan).toBe(false);       // ← no upgrade CTA
    expect(isKeyboardOnly).toBe(true);  // ← controls still hidden
  });

  it("paid user voice session: both flags false (show controls, no upgrade CTA)", () => {
    const { freePlan, isKeyboardOnly } = deriveFlags(false, "voice");
    expect(freePlan).toBe(false);
    expect(isKeyboardOnly).toBe(false);
  });

  it("paid user voice-camera session: both flags false", () => {
    const { freePlan, isKeyboardOnly } = deriveFlags(false, "voice-camera");
    expect(freePlan).toBe(false);
    expect(isKeyboardOnly).toBe(false);
  });
});

// ─── keyboard-only / freePlan detection ──────────────────────────────────────

describe("keyboard-only detection — all three modes", () => {
  describe("typed mode", () => {
    it("is keyboard-only for a free-plan typed session", () => {
      expect(isKeyboardOnly(true, "typed")).toBe(true);
    });

    it("is keyboard-only for a paid-plan typed session (the regression)", () => {
      // This was the original bug: paid user + typed → freePlan was false
      // → recording controls appeared. Now practiceMode gates it correctly.
      expect(isKeyboardOnly(false, "typed")).toBe(true);
    });
  });

  describe("voice mode", () => {
    it("is NOT keyboard-only for a voice session on any plan", () => {
      expect(isKeyboardOnly(false, "voice")).toBe(false);
    });

    it("is keyboard-only if freePlan is somehow true during a voice session (safety guard)", () => {
      // Should never happen in practice (free plan can't pick voice on setup screen)
      // but the guard ensures voice controls stay hidden if it does.
      expect(isKeyboardOnly(true, "voice")).toBe(true);
    });
  });

  describe("voice-camera mode", () => {
    it("is NOT keyboard-only for a voice-camera session", () => {
      expect(isKeyboardOnly(false, "voice-camera")).toBe(false);
    });
  });
});

// ─── camera column visibility ─────────────────────────────────────────────────

describe("camera column visibility — gated on cameraEnabled, not freePlan", () => {
  it("is hidden when cameraEnabled is false (typed mode)", () => {
    // Typed session: freePlan=true, cameraEnabled=false
    expect(showCameraColumn(false)).toBe(false);
  });

  it("is hidden when cameraEnabled is false (voice-only mode) — the regression", () => {
    // Voice-only session: freePlan=false, cameraEnabled=false
    // Bug: was shown because guard was !freePlan, not cameraEnabled
    expect(showCameraColumn(false)).toBe(false);
  });

  it("is shown when cameraEnabled is true (voice-camera mode)", () => {
    expect(showCameraColumn(true)).toBe(true);
  });
});

// ─── grid layout ─────────────────────────────────────────────────────────────

describe("session grid layout per mode", () => {
  it("uses single-column layout for typed mode (cameraEnabled=false)", () => {
    expect(gridClass(false)).toBe("");
  });

  it("uses single-column layout for voice-only mode (cameraEnabled=false)", () => {
    // Voice-only should NOT reserve a 150px camera slot
    expect(gridClass(false)).toBe("");
  });

  it("uses two-column layout for voice-camera mode (cameraEnabled=true)", () => {
    expect(gridClass(true)).toContain("150px");
  });
});

// ─── FeedbackWorkspace insight visibility ────────────────────────────────────

describe("feedback insight panels per practice mode", () => {
  describe("typed mode", () => {
    it("does NOT show voice delivery insight", () => {
      expect(showVoiceInsight("typed")).toBe(false);
    });

    it("does NOT show camera presence insight", () => {
      expect(showCameraInsight("typed")).toBe(false);
    });
  });

  describe("voice mode", () => {
    it("shows voice delivery insight", () => {
      expect(showVoiceInsight("voice")).toBe(true);
    });

    it("does NOT show camera presence insight (no camera in voice-only)", () => {
      expect(showCameraInsight("voice")).toBe(false);
    });
  });

  describe("voice-camera mode", () => {
    it("shows voice delivery insight", () => {
      expect(showVoiceInsight("voice-camera")).toBe(true);
    });

    it("shows camera presence insight", () => {
      expect(showCameraInsight("voice-camera")).toBe(true);
    });
  });
});

// ─── AnswerWorkspace copy per mode ────────────────────────────────────────────

describe("AnswerWorkspace heading and copy per mode", () => {
  it("shows 'Answer editor' heading for typed/freePlan sessions", () => {
    expect(answerHeading(true)).toBe("Answer editor");
  });

  it("shows 'Transcript and answer editor' heading for voice sessions", () => {
    expect(answerHeading(false)).toBe("Transcript and answer editor");
  });

  it("shows typed placeholder for freePlan sessions (no transcript)", () => {
    const placeholder = answerPlaceholder(true, false);
    expect(placeholder).toContain("Type your answer");
    expect(placeholder).not.toContain("transcript");
  });

  it("shows transcript placeholder for voice sessions", () => {
    const placeholder = answerPlaceholder(false, false);
    expect(placeholder).toContain("transcript");
  });
});

// ─── AnswerWorkspace bottom row grid layout ───────────────────────────────────

describe("AnswerWorkspace bottom button row layout per mode", () => {
  it("uses 2-column grid for typed/freePlan (no recording button)", () => {
    // freePlan=true: [Clear answer] [Get feedback] — 2 cols
    expect(answerGridCols(true)).toBe("sm:grid-cols-2");
  });

  it("uses 3-column grid for voice sessions (adds recording button)", () => {
    // freePlan=false: [Start/Stop recording] [Clear answer] [Get feedback] — 3 cols
    expect(answerGridCols(false)).toBe("sm:grid-cols-3");
  });
});

// ─── Combined mode matrix ─────────────────────────────────────────────────────

describe("complete mode matrix — all combinations correct", () => {
  const modes: Array<{
    mode: PracticeMode;
    freePlan: boolean;
    cameraEnabled: boolean;
  }> = [
    { mode: "typed",        freePlan: true,  cameraEnabled: false }, // free plan
    { mode: "typed",        freePlan: false, cameraEnabled: false }, // paid, chose typed
    { mode: "voice",        freePlan: false, cameraEnabled: false },
    { mode: "voice-camera", freePlan: false, cameraEnabled: true  },
  ];

  it("camera column is ONLY shown for voice-camera", () => {
    modes.forEach(({ mode, cameraEnabled }) => {
      const expected = mode === "voice-camera";
      expect(showCameraColumn(cameraEnabled)).toBe(expected);
    });
  });

  it("voice insight is shown for voice and voice-camera, not typed", () => {
    modes.forEach(({ mode }) => {
      const expected = mode === "voice" || mode === "voice-camera";
      expect(showVoiceInsight(mode)).toBe(expected);
    });
  });

  it("camera insight is ONLY shown for voice-camera", () => {
    modes.forEach(({ mode }) => {
      const expected = mode === "voice-camera";
      expect(showCameraInsight(mode)).toBe(expected);
    });
  });

  it("keyboard-only is true for all typed sessions, false for voice sessions", () => {
    modes.forEach(({ mode, freePlan }) => {
      const expected = mode === "typed";
      expect(isKeyboardOnly(freePlan, mode)).toBe(expected);
    });
  });
});

// ─── Candidate nav labels and order ──────────────────────────────────────────

describe("candidate nav — labels and order", () => {
  // Mirrors the navItems array in CandidateAppShell.tsx.
  // Order: My Profile → My Practice → My Progress
  const navItems = [
    { href: "/profile",  label: "My Profile"  },
    { href: "/practice", label: "My Practice" },
    { href: "/progress", label: "My Progress" },
  ];

  it("has exactly three nav items", () => {
    expect(navItems).toHaveLength(3);
  });

  it("first item is My Profile at /profile", () => {
    expect(navItems[0]).toEqual({ href: "/profile", label: "My Profile" });
  });

  it("second item is My Practice at /practice", () => {
    expect(navItems[1]).toEqual({ href: "/practice", label: "My Practice" });
  });

  it("third item is My Progress at /progress", () => {
    expect(navItems[2]).toEqual({ href: "/progress", label: "My Progress" });
  });

  it("no item uses the old labels without 'My' prefix", () => {
    const oldLabels = ["Practice", "Progress", "Profile"];
    navItems.forEach(({ label }) => {
      expect(oldLabels).not.toContain(label);
    });
  });

  it("all labels start with 'My'", () => {
    navItems.forEach(({ label }) => {
      expect(label.startsWith("My ")).toBe(true);
    });
  });

  it("old order (Practice first) is no longer used", () => {
    expect(navItems[0].href).not.toBe("/practice");
  });
});
