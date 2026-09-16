/**
 * Interview format rules.
 *
 * Two formats: the coaching flow we have always had, and a one-way video
 * interview that mimics what employers actually put candidates through. The
 * settings come from the browser, so everything is bounded here rather than
 * trusted, and the defaults are the realistic ones (60 seconds to think, 2
 * minutes to answer, no retake, report at the end).
 */
import { describe, it, expect } from "vitest";
import {
  INTERVIEW_FORMATS,
  DEFAULT_VIDEO_SETTINGS,
  normaliseInterviewFormat,
  normaliseVideoSettings,
  isOneWayVideo,
} from "@/app/lib/interviewFormat";

describe("normaliseInterviewFormat", () => {
  it("accepts the two formats", () => {
    expect(normaliseInterviewFormat("traditional")).toBe("traditional");
    expect(normaliseInterviewFormat("one_way_video")).toBe("one_way_video");
  });

  it("falls back to the coaching flow for anything else", () => {
    expect(normaliseInterviewFormat("hologram")).toBe("traditional");
    expect(normaliseInterviewFormat(undefined)).toBe("traditional");
    expect(normaliseInterviewFormat(null)).toBe("traditional");
    expect(normaliseInterviewFormat(42)).toBe("traditional");
  });

  it("knows which format records video", () => {
    expect(isOneWayVideo("one_way_video")).toBe(true);
    expect(isOneWayVideo("traditional")).toBe(false);
  });

  it("offers both formats for the setup screen", () => {
    expect(INTERVIEW_FORMATS.map((f) => f.value)).toEqual(["traditional", "one_way_video"]);
    for (const format of INTERVIEW_FORMATS) {
      expect(format.label.length).toBeGreaterThan(0);
      expect(format.description.length).toBeGreaterThan(0);
    }
  });
});

describe("normaliseVideoSettings", () => {
  it("uses realistic defaults when nothing is supplied", () => {
    expect(normaliseVideoSettings(undefined)).toEqual(DEFAULT_VIDEO_SETTINGS);
    expect(DEFAULT_VIDEO_SETTINGS).toEqual({
      prepSeconds: 60,
      answerSeconds: 120,
      retakesAllowed: 0,
      feedbackTiming: "end",
    });
  });

  it("keeps the values a candidate can actually choose", () => {
    const settings = normaliseVideoSettings({
      prepSeconds: 30,
      answerSeconds: 180,
      retakesAllowed: 1,
      feedbackTiming: "each",
    });

    expect(settings).toEqual({
      prepSeconds: 30,
      answerSeconds: 180,
      retakesAllowed: 1,
      feedbackTiming: "each",
    });
  });

  it("refuses values that were not offered, so a tampered config cannot buy more time", () => {
    const settings = normaliseVideoSettings({
      prepSeconds: 6000,
      answerSeconds: 9999,
      retakesAllowed: 99,
      feedbackTiming: "never",
    });

    expect(settings).toEqual(DEFAULT_VIDEO_SETTINGS);
  });

  it("fills in only the missing parts", () => {
    const settings = normaliseVideoSettings({ answerSeconds: 60 });

    expect(settings.answerSeconds).toBe(60);
    expect(settings.prepSeconds).toBe(60);
    expect(settings.retakesAllowed).toBe(0);
    expect(settings.feedbackTiming).toBe("end");
  });
});
