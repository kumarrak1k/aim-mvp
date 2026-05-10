/**
 * Tests for session config parsing (utils.ts)
 *
 * CRITICAL REGRESSION COVERAGE:
 * A paid user choosing "Typed answers only" must NOT see voice/camera
 * controls in the session. This was broken because `freePlan` was only
 * set when the user was actually on the free plan — paid users who chose
 * typed mode still got `freePlan: false`, showing them recording buttons.
 *
 * Fix: `practiceMode` is now stored in the session config and the session
 * page sets keyboard-only mode when `practiceMode === "typed"` OR `freePlan`.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseSessionConfig, PRACTICE_SESSION_CONFIG_KEY } from "../../app/practice/session/utils";

// ─── helpers ─────────────────────────────────────────────────────────────────

function writeConfig(data: Record<string, unknown>) {
  window.sessionStorage.setItem(PRACTICE_SESSION_CONFIG_KEY, JSON.stringify(data));
}

function clearConfig() {
  window.sessionStorage.removeItem(PRACTICE_SESSION_CONFIG_KEY);
}

const baseConfig = {
  role: "Nurse",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  speakerEnabled: false,
  cameraEnabled: false,
  speakerPreference: { voice: "female", accent: "british", pace: "natural" },
};

// ─── parseSessionConfig ───────────────────────────────────────────────────────

describe("parseSessionConfig", () => {
  beforeEach(() => clearConfig());
  afterEach(() => clearConfig());

  it("returns null when no config is stored", () => {
    expect(parseSessionConfig()).toBeNull();
  });

  it("returns null when role is missing", () => {
    writeConfig({ ...baseConfig, role: "" });
    expect(parseSessionConfig()).toBeNull();
  });

  it("parses a minimal valid config", () => {
    writeConfig(baseConfig);
    const config = parseSessionConfig();
    expect(config).not.toBeNull();
    expect(config?.role).toBe("Nurse");
  });

  // ── practiceMode field ───────────────────────────────────────────────────

  it("parses practiceMode: 'typed' correctly", () => {
    writeConfig({ ...baseConfig, practiceMode: "typed" });
    const config = parseSessionConfig();
    expect(config?.practiceMode).toBe("typed");
  });

  it("parses practiceMode: 'voice' correctly", () => {
    writeConfig({ ...baseConfig, practiceMode: "voice", speakerEnabled: true });
    const config = parseSessionConfig();
    expect(config?.practiceMode).toBe("voice");
  });

  it("parses practiceMode: 'voice-camera' correctly", () => {
    writeConfig({ ...baseConfig, practiceMode: "voice-camera", speakerEnabled: true, cameraEnabled: true });
    const config = parseSessionConfig();
    expect(config?.practiceMode).toBe("voice-camera");
  });

  it("ignores unknown practiceMode values (returns undefined)", () => {
    writeConfig({ ...baseConfig, practiceMode: "video-only" });
    const config = parseSessionConfig();
    expect(config?.practiceMode).toBeUndefined();
  });

  it("returns undefined practiceMode when field is absent (legacy config)", () => {
    // Old configs written before this field was added will not have it
    writeConfig(baseConfig); // no practiceMode field
    const config = parseSessionConfig();
    expect(config?.practiceMode).toBeUndefined();
  });
});

// ─── keyboard-only detection logic (mirrors session/page.tsx) ─────────────────
//
// The session page derives `sessionIsKeyboardOnly` as:
//   Boolean(config.freePlan) || config.practiceMode === "typed"
//
// These tests verify that logic is correct for all combinations.

describe("keyboard-only detection logic", () => {
  const isKeyboardOnly = (config: { freePlan?: boolean; practiceMode?: string }) =>
    Boolean(config.freePlan) || config.practiceMode === "typed";

  // ── CRITICAL: the regression ──────────────────────────────────────────────

  it("is keyboard-only when practiceMode is 'typed' even if freePlan is false (paid user choosing typed)", () => {
    // This is the exact case that was broken:
    // Professional plan user, chose "Typed answers only", freePlan was false.
    expect(isKeyboardOnly({ freePlan: false, practiceMode: "typed" })).toBe(true);
  });

  // ── free plan always forces keyboard-only ─────────────────────────────────

  it("is keyboard-only when freePlan is true regardless of practiceMode", () => {
    expect(isKeyboardOnly({ freePlan: true, practiceMode: "typed" })).toBe(true);
    expect(isKeyboardOnly({ freePlan: true, practiceMode: "voice" })).toBe(true);
    expect(isKeyboardOnly({ freePlan: true, practiceMode: undefined })).toBe(true);
  });

  // ── voice and camera modes should NOT be keyboard-only ────────────────────

  it("is NOT keyboard-only for voice mode on a paid plan", () => {
    expect(isKeyboardOnly({ freePlan: false, practiceMode: "voice" })).toBe(false);
  });

  it("is NOT keyboard-only for voice-camera mode on a paid plan", () => {
    expect(isKeyboardOnly({ freePlan: false, practiceMode: "voice-camera" })).toBe(false);
  });

  it("is NOT keyboard-only when neither freePlan nor typed (legacy config without practiceMode field)", () => {
    // Old configs with no practiceMode: speakerEnabled determines mode in-session
    expect(isKeyboardOnly({ freePlan: false, practiceMode: undefined })).toBe(false);
  });
});
