/**
 * Carrying on an unfinished interview depends on the resume payload surviving
 * the trip through sessionStorage.
 *
 * parseSessionConfig rebuilds the config field by field (so a tampered or
 * stale blob cannot inject anything), which silently dropped `resume` and sent
 * every resumed interview back to question 1.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PRACTICE_SESSION_CONFIG_KEY, parseSessionConfig } from "@/app/practice/session/utils";

const baseConfig = {
  role: "Graduate analyst",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  speakerEnabled: false,
  cameraEnabled: false,
  totalQuestions: 5,
};

function store(config: Record<string, unknown>) {
  window.sessionStorage.setItem(PRACTICE_SESSION_CONFIG_KEY, JSON.stringify(config));
}

describe("parseSessionConfig resume payload", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps the attempt, answer count and saved answers", () => {
    store({
      ...baseConfig,
      resume: {
        attemptId: "att_1",
        answeredCount: 2,
        results: [{ question: "Q1", answer: "A1" }, { question: "Q2", answer: "A2" }],
      },
    });

    const config = parseSessionConfig();

    expect(config?.resume).toMatchObject({ attemptId: "att_1", answeredCount: 2 });
    expect(config?.resume?.results).toHaveLength(2);
  });

  it("ignores a resume payload with no attempt id", () => {
    store({ ...baseConfig, resume: { answeredCount: 2, results: [] } });

    expect(parseSessionConfig()?.resume).toBeUndefined();
  });

  it("leaves resume unset for a normal new interview", () => {
    store(baseConfig);

    expect(parseSessionConfig()?.resume).toBeUndefined();
  });
});
