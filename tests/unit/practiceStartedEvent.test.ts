/**
 * Phase 0 instrumentation: practice_started carries the attemptId, so a start
 * can be joined to the practice_answered events and the saved session that
 * follow it. Without it, starts and answers can only be matched by time, which
 * breaks as soon as a candidate restarts an interview.
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
  const emptyProfile = {
    cvText: "",
    currentRole: "",
    roleSpec: "",
    interviewGoals: "",
    cvFileName: "",
    roleSpecFileName: "",
    updatedAt: "",
  };
  return { OpenAIErrorMock, emptyProfile, record: vi.fn() };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1", sessionClaims: null }),
}));

vi.mock("@/app/lib/rateLimit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: { practiceSession: { findMany: async () => [] } },
}));

vi.mock("@/app/lib/openai-client", () => ({
  OpenAIError: h.OpenAIErrorMock,
  callOpenAIChat: async () => ({
    choices: [
      { message: { content: JSON.stringify({ question: "Tell me about a time you led a team." }) } },
    ],
  }),
}));

vi.mock("@/app/lib/candidateProfile", () => ({
  getCandidateProfile: async () => h.emptyProfile,
  EMPTY_PROFILE: h.emptyProfile,
}));

vi.mock("@/app/lib/candidatePlan", () => ({
  resolveCandidatePlanFromClaims: () => ({ effectivePlan: "free", isTrial: false }),
}));

// Real ACTIVITY_EVENTS values, database write replaced.
vi.mock("@/app/lib/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/activity")>()),
  recordActivity: h.record,
}));

import { POST } from "@/app/api/interview/route";

function questionRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/interview", {
    method: "POST",
    body: JSON.stringify({
      role: "Graduate analyst",
      questionNumber: 1,
      totalQuestions: 3,
      history: [],
      ...body,
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

function startedDetails() {
  return h.record.mock.calls
    .filter((call) => call[1] === "practice_started")
    .map((call) => call[3] as Record<string, unknown>);
}

describe("POST /api/interview records the attempt on practice_started", () => {
  beforeEach(() => {
    h.record.mockReset();
  });

  it("includes the attempt id when question 1 is generated", async () => {
    const res = await POST(questionRequest({ attemptId: "att_1" }));

    expect(res.status).toBe(200);
    expect(startedDetails()).toHaveLength(1);
    expect(startedDetails()[0]).toMatchObject({ attemptId: "att_1", totalQuestions: 3 });
  });

  it("stores null when the attempt id is malformed", async () => {
    const res = await POST(questionRequest({ attemptId: "x".repeat(200) }));

    expect(res.status).toBe(200);
    expect(startedDetails()[0]).toMatchObject({ attemptId: null });
  });
});
