/**
 * Tests for speechGuards.ts
 *
 * Critical regression: stripQuestionLeakageFromTranscript was incorrectly
 * clearing typed answers when they overlapped with question words.
 * This test suite ensures that bug cannot re-appear.
 */

import { describe, it, expect } from "vitest";
import {
  countPhrase,
  getWords,
  normalizeSpeechGuardText,
  stripQuestionLeakageFromTranscript,
} from "../../app/practice/lib/speechGuards";

// ─── countPhrase ─────────────────────────────────────────────────────────────

describe("countPhrase", () => {
  it("counts a single occurrence", () => {
    expect(countPhrase("I said um once", "um")).toBe(1);
  });

  it("counts multiple occurrences", () => {
    expect(countPhrase("um er um like um", "um")).toBe(3);
  });

  it("is case insensitive", () => {
    expect(countPhrase("Um UM uM um", "um")).toBe(4);
  });

  it("does not count partial word matches", () => {
    // 'er' should not match inside 'interview'
    expect(countPhrase("interview performance", "er")).toBe(0);
  });

  it("counts multi-word phrases", () => {
    expect(countPhrase("you know what you know", "you know")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countPhrase("", "um")).toBe(0);
  });
});

// ─── getWords ────────────────────────────────────────────────────────────────

describe("getWords", () => {
  it("splits a normal sentence", () => {
    expect(getWords("Hello world")).toEqual(["hello", "world"]);
  });

  it("strips punctuation", () => {
    expect(getWords("Hello, world!")).toEqual(["hello", "world"]);
  });

  it("removes empty tokens", () => {
    expect(getWords("  lots   of   spaces  ")).toEqual(["lots", "of", "spaces"]);
  });

  it("returns empty array for empty string", () => {
    expect(getWords("")).toEqual([]);
  });
});

// ─── normalizeSpeechGuardText ─────────────────────────────────────────────────

describe("normalizeSpeechGuardText", () => {
  it("lowercases and trims", () => {
    expect(normalizeSpeechGuardText("  Hello WORLD  ")).toBe("hello world");
  });

  it("replaces punctuation with spaces and collapses them", () => {
    // comma and exclamation mark become spaces, then collapsed + trimmed
    expect(normalizeSpeechGuardText("Hello, World!")).toBe("hello world");
  });

  it("collapses multiple spaces into one", () => {
    // internal \s+ → single space; already trimmed
    expect(normalizeSpeechGuardText("a   b   c")).toBe("a b c");
  });
});

// ─── stripQuestionLeakageFromTranscript ──────────────────────────────────────

describe("stripQuestionLeakageFromTranscript", () => {
  const question =
    "Can you describe a situation where you had to adapt your communication style?";

  // ── CRITICAL: typed answers must NEVER be cleared ──────────────────────────

  it("does NOT clear a genuine typed answer even if it shares words with the question", () => {
    const typed = "In my previous role I had to adapt my communication style when working with a difficult team member. I organised a one-to-one meeting.";
    expect(stripQuestionLeakageFromTranscript(typed, question)).toBe(typed);
  });

  it("does NOT clear a short typed answer like 'no'", () => {
    expect(stripQuestionLeakageFromTranscript("no", question)).toBe("no");
  });

  it("does NOT clear a typed answer that starts differently from the question", () => {
    const typed = "During my nursing placement I encountered a patient who was anxious.";
    expect(stripQuestionLeakageFromTranscript(typed, question)).toBe(typed);
  });

  it("does NOT clear a typed answer that mentions 'communication' (overlap word)", () => {
    const typed = "Good communication is essential in nursing.";
    expect(stripQuestionLeakageFromTranscript(typed, question)).toBe(typed);
  });

  // ── Legitimate leakage stripping ──────────────────────────────────────────

  it("strips transcript that is IDENTICAL to the question", () => {
    expect(
      stripQuestionLeakageFromTranscript(question, question)
    ).toBe("");
  });

  it("strips transcript that is a prefix of the question (voice recognition echoing)", () => {
    // Voice recognition sometimes echoes the first words of the question back
    const leaked = "Can you describe a situation where you had to adapt";
    expect(
      stripQuestionLeakageFromTranscript(leaked, question)
    ).toBe("");
  });

  it("returns empty string for empty transcript", () => {
    expect(stripQuestionLeakageFromTranscript("", question)).toBe("");
  });

  it("returns transcript unchanged when question is empty", () => {
    expect(stripQuestionLeakageFromTranscript("My answer here", "")).toBe(
      "My answer here"
    );
  });

  it("returns transcript unchanged when both are empty", () => {
    expect(stripQuestionLeakageFromTranscript("", "")).toBe("");
  });

  // ── Prefix stripping (voice echoes first N words of question) ─────────────

  it("strips matching prefix words from transcript (voice echo then real answer)", () => {
    // Voice echoes 6 words of the question, then the user's answer follows
    const transcript =
      "Can you describe a situation where you yes I did that at my previous job as a nurse";
    const result = stripQuestionLeakageFromTranscript(transcript, question);
    // Should strip the echoed question prefix, keeping the actual answer
    expect(result).not.toContain("Can you describe");
    expect(result.length).toBeGreaterThan(0);
  });
});
