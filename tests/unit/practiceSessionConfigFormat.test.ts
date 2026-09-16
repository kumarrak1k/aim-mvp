/**
 * The chosen interview format has to survive the trip through sessionStorage.
 *
 * parseSessionConfig rebuilds the config field by field, which silently dropped
 * the resume payload when that was added. The same trap applies here: a format
 * that does not arrive means someone who asked for a one-way video interview
 * gets the coaching flow instead.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PRACTICE_SESSION_CONFIG_KEY, parseSessionConfig } from "@/app/practice/session/utils";
import { DEFAULT_VIDEO_SETTINGS } from "@/app/lib/interviewFormat";

const baseConfig = {
  role: "Graduate analyst",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  speakerEnabled: true,
  cameraEnabled: true,
  totalQuestions: 5,
};

function store(config: Record<string, unknown>) {
  window.sessionStorage.setItem(PRACTICE_SESSION_CONFIG_KEY, JSON.stringify(config));
}

describe("parseSessionConfig interview format", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps a one-way video interview and its settings", () => {
    store({
      ...baseConfig,
      interviewFormat: "one_way_video",
      videoSettings: {
        prepSeconds: 30,
        answerSeconds: 180,
        retakesAllowed: 1,
        feedbackTiming: "each",
      },
    });

    const config = parseSessionConfig();

    expect(config?.interviewFormat).toBe("one_way_video");
    expect(config?.videoSettings).toEqual({
      prepSeconds: 30,
      answerSeconds: 180,
      retakesAllowed: 1,
      feedbackTiming: "each",
    });
  });

  it("defaults to the coaching flow when no format was stored", () => {
    store(baseConfig);

    const config = parseSessionConfig();

    expect(config?.interviewFormat).toBe("traditional");
    expect(config?.videoSettings).toEqual(DEFAULT_VIDEO_SETTINGS);
  });

  it("bounds settings that were never on offer", () => {
    store({
      ...baseConfig,
      interviewFormat: "one_way_video",
      videoSettings: { prepSeconds: 3600, answerSeconds: 1, retakesAllowed: 50 },
    });

    expect(parseSessionConfig()?.videoSettings).toEqual(DEFAULT_VIDEO_SETTINGS);
  });
});
