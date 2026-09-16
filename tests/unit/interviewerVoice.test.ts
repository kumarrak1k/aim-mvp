/**
 * Which provider and voice reads the question.
 *
 * Rakesh chose ElevenLabs Alice and Dave by ear after rejecting the OpenAI
 * lineup: those are American voices being instructed to fake Received
 * Pronunciation, and the 30% of the time they slip is what an ear catches.
 * These are natively British.
 *
 * OpenAI stays as the fallback, so a missing key or a provider outage means a
 * different voice rather than silence.
 */
import { describe, it, expect } from "vitest";
import {
  resolveVoiceProvider,
  elevenLabsVoiceId,
  playbackRateForPace,
  ELEVENLABS_MODEL,
} from "@/app/lib/interviewerVoice";

describe("choosing the provider", () => {
  it("uses ElevenLabs when it is configured", () => {
    expect(resolveVoiceProvider({ elevenLabsKey: "key", openAiKey: "key" })).toBe("elevenlabs");
  });

  it("falls back to OpenAI when ElevenLabs is not configured", () => {
    expect(resolveVoiceProvider({ elevenLabsKey: "", openAiKey: "key" })).toBe("openai");
    expect(resolveVoiceProvider({ elevenLabsKey: undefined, openAiKey: "key" })).toBe("openai");
  });

  it("reports that there is no voice at all when neither is configured", () => {
    expect(resolveVoiceProvider({ elevenLabsKey: "", openAiKey: "" })).toBe("none");
  });

  it("can be forced back to OpenAI without removing the key", () => {
    expect(
      resolveVoiceProvider({ elevenLabsKey: "key", openAiKey: "key", forced: "openai" })
    ).toBe("openai");
  });
});

describe("the chosen voices", () => {
  it("maps the speaker preference onto Alice and Dave", () => {
    expect(elevenLabsVoiceId("female")).toBe("Xb7hH8MSUJpSbSDYk0k2");
    expect(elevenLabsVoiceId("male")).toBe("CYw3kZ02Hs0563khs1Fj");
  });

  it("uses the cheap, fast model: half the credits and the questions are short", () => {
    expect(ELEVENLABS_MODEL).toBe("eleven_flash_v2_5");
  });
});

/**
 * Pace is applied in the browser rather than baked into the audio. One
 * recording per question per voice can then be cached and reused, instead of
 * three, and the candidate's choice still changes what they hear.
 */
describe("pace", () => {
  it("leaves a natural pace alone", () => {
    expect(playbackRateForPace("natural")).toBe(1);
  });

  it("slows down and speeds up without distorting the voice", () => {
    expect(playbackRateForPace("slow")).toBeLessThan(1);
    expect(playbackRateForPace("slow")).toBeGreaterThan(0.85);
    expect(playbackRateForPace("energetic")).toBeGreaterThan(1);
    expect(playbackRateForPace("energetic")).toBeLessThan(1.2);
  });

  it("treats anything unrecognised as natural", () => {
    expect(playbackRateForPace("whatever")).toBe(1);
  });
});
