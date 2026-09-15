/**
 * Phase 0 instrumentation: /api/feedback records a server-side
 * `practice_answered` event each time an answer is successfully scored.
 *
 * Why here: until now only practice_started (question 1 generated) and
 * practice_completed (whole session saved) existed, so a candidate who answered
 * two questions and left was indistinguishable from one who never answered.
 * The feedback route is authenticated, runs once per scored answer and needs no
 * analytics consent, so it is the most reliable place to record progress.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  class OpenAIErrorMock extends Error {
    status: number;
    detail = "mock";
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return {
    OpenAIErrorMock,
    state: { openAIFails: false },
    record: vi.fn(),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

vi.mock("@/app/lib/rateLimit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

vi.mock("@/app/lib/moderation", () => ({
  moderateText: async () => ({ flagged: false }),
}));

vi.mock("@/app/lib/candidateProfile", () => ({
  getCandidateProfile: async () => ({
    cvText: "",
    roleSpec: "",
    interviewGoals: "",
    cvFileName: "",
    roleSpecFileName: "",
    updatedAt: "",
  }),
}));

vi.mock("@/app/lib/prisma", () => ({ prisma: {} }));

vi.mock("@/app/lib/openai-client", () => ({
  OpenAIError: h.OpenAIErrorMock,
  callOpenAIChat: async () => {
    if (h.state.openAIFails) throw new h.OpenAIErrorMock("OpenAI is down", 503);
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              overall_score: 7,
              category_scores: { content: 7, clarity: 7, relevance: 7, structure: 7, confidence: 7 },
              strengths: ["Clear example"],
              improvements: ["Quantify the result"],
            }),
          },
        },
      ],
    };
  },
}));

// Keep the real ACTIVITY_EVENTS values so the test fails if the event name is
// missing or wrong; only the database write is replaced.
vi.mock("@/app/lib/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/activity")>()),
  recordActivity: h.record,
}));

import { POST } from "@/app/api/feedback/route";

function feedbackRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      question: "Tell me about a time you worked in a team.",
      answer: "At university I led a group project and we finished a week early.",
      practiceMode: "typed",
      ...body,
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

function answeredCalls() {
  return h.record.mock.calls.filter((call) => call[1] === "practice_answered");
}

describe("POST /api/feedback records practice_answered", () => {
  beforeEach(() => {
    h.state.openAIFails = false;
    h.record.mockReset();
  });

  it("records the attempt, question position and mode when an answer is scored", async () => {
    const res = await POST(
      feedbackRequest({ attemptId: "att_123", questionNumber: 2, totalQuestions: 5 })
    );

    expect(res.status).toBe(200);
    expect(answeredCalls()).toHaveLength(1);
    const [userId, , , detail] = answeredCalls()[0];
    expect(userId).toBe("user_1");
    expect(detail).toEqual({
      attemptId: "att_123",
      questionNumber: 2,
      totalQuestions: 5,
      practiceMode: "typed",
      isAssessment: false,
    });
  });

  it("does not record an answer when scoring fails", async () => {
    h.state.openAIFails = true;

    const res = await POST(
      feedbackRequest({ attemptId: "att_123", questionNumber: 1, totalQuestions: 3 })
    );

    expect(res.status).toBe(503);
    expect(answeredCalls()).toHaveLength(0);
  });

  it("stores null for untrusted attempt fields that are malformed or out of range", async () => {
    const res = await POST(
      feedbackRequest({
        attemptId: "x".repeat(200),
        questionNumber: 99,
        totalQuestions: "five",
        practiceMode: "hologram",
      })
    );

    expect(res.status).toBe(200);
    const [, , , detail] = answeredCalls()[0];
    expect(detail).toEqual({
      attemptId: null,
      questionNumber: null,
      totalQuestions: null,
      practiceMode: null,
      isAssessment: false,
    });
  });
});
