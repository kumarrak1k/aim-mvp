/**
 * Phase 0 instrumentation: practice_completed carries the attemptId and how
 * many answers were saved, so a finished session joins to its start and answer
 * events and the admin funnel can tell a full session from a short one.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ record: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/app/lib/sessionScope", () => ({
  getAssessmentLinkedSessionIds: async () => [],
}));

vi.mock("@/app/lib/candidatePlan", () => ({
  getCandidatePlan: async () => ({
    isTrial: false,
    isUnlimited: true,
    planName: "Plus",
    effectivePlan: "plus",
    trialStartedAt: null,
  }),
  TRIAL_USAGE_CAPS: { practiceSessions: 15, assessmentCentres: 2, careerDocs: 5 },
  FREE_TIER: { practiceSessionsPerWindow: 3, windowDays: 30, assessmentCentres: 1, careerDocs: 2 },
}));

vi.mock("@/app/lib/prisma", () => {
  const tx = {
    practiceSession: {
      // No progress row for this attempt: the save creates one.
      findFirst: async () => null,
      update: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "sess_1",
        ...data,
        createdAt: new Date("2026-09-15T10:00:00Z"),
      }),
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "sess_1",
        ...data,
        createdAt: new Date("2026-09-15T10:00:00Z"),
      }),
    },
    candidateAssignment: { findUnique: async () => null, update: async () => ({}) },
  };
  return {
    prisma: {
      practiceSession: { count: async () => 0, findFirst: async () => null },
      $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    },
  };
});

// Real ACTIVITY_EVENTS values, database write replaced.
vi.mock("@/app/lib/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/activity")>()),
  recordActivity: h.record,
}));

import { POST } from "@/app/api/practice-sessions/route";

function saveRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/practice-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "Graduate analyst",
      experienceLevel: "Graduate / entry level",
      interviewType: "Competency / behavioural",
      difficulty: "Standard",
      focusArea: "Balanced",
      practiceMode: "typed",
      totalQuestions: 3,
      summary: { overall_score: 7, hire_signal: "Moderate" },
      results: [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
        { question: "Q3", answer: "A3" },
      ],
      ...body,
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/practice-sessions records the attempt on practice_completed", () => {
  beforeEach(() => {
    h.record.mockReset();
  });

  it("includes the attempt id and the number of answers saved", async () => {
    const res = await POST(saveRequest({ attemptId: "att_1" }));

    expect(res.status).toBeLessThan(300);
    const completed = h.record.mock.calls.filter((call) => call[1] === "practice_completed");
    expect(completed).toHaveLength(1);
    expect(completed[0][3]).toMatchObject({ attemptId: "att_1", answeredCount: 3 });
  });
});
