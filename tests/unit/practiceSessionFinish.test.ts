/**
 * POST /api/practice-sessions finishes an interview.
 *
 * From Phase 1 the row usually already exists (created as answers were saved),
 * so finishing updates that row rather than creating a second one. Finishing
 * early is allowed for personal practice but never for a company assessment.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  state: { existing: null as null | Record<string, unknown> },
  writes: vi.fn(),
  record: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/app/lib/sessionScope", () => ({
  getAssessmentLinkedSessionIds: async () => new Set<string>(),
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
      findFirst: async () => h.state.existing,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        h.writes({ op: "create", data });
        return { id: "sess_new", ...data, createdAt: new Date("2026-09-16T09:00:00Z") };
      },
      update: async (args: { data: Record<string, unknown> }) => {
        h.writes({ op: "update", data: args.data });
        return {
          id: "sess_1",
          ...args.data,
          createdAt: new Date("2026-09-16T09:00:00Z"),
        };
      },
    },
    candidateAssignment: { findUnique: async () => null, update: async () => ({}) },
  };
  return {
    prisma: {
      practiceSession: { count: async () => 0, findFirst: async () => h.state.existing },
      $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
    },
  };
});

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
      totalQuestions: 5,
      summary: { overall_score: 7, hire_signal: "Moderate" },
      results: [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
      ],
      attemptId: "att_1",
      ...body,
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/practice-sessions finishing an interview", () => {
  beforeEach(() => {
    h.state.existing = null;
    h.writes.mockReset();
    h.record.mockReset();
  });

  it("marks an interview stopped part way as finished early", async () => {
    h.state.existing = { id: "sess_1", status: "in_progress", answeredCount: 2 };

    const res = await POST(saveRequest({ finishedEarly: true }));

    expect(res.status).toBeLessThan(300);
    const call = h.writes.mock.calls[0][0];
    expect(call.op).toBe("update");
    expect(call.data).toMatchObject({ status: "finished_early", answeredCount: 2 });
  });

  it("marks a full interview as completed", async () => {
    h.state.existing = { id: "sess_1", status: "in_progress", answeredCount: 4 };

    const res = await POST(
      saveRequest({
        results: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
          { question: "Q3", answer: "A3" },
          { question: "Q4", answer: "A4" },
          { question: "Q5", answer: "A5" },
        ],
        totalQuestions: 5,
      })
    );

    expect(res.status).toBeLessThan(300);
    expect(h.writes.mock.calls[0][0].data).toMatchObject({ status: "completed", answeredCount: 5 });
  });

  it("still creates a row when no progress was saved (older clients)", async () => {
    const res = await POST(saveRequest({ attemptId: undefined }));

    expect(res.status).toBeLessThan(300);
    expect(h.writes.mock.calls[0][0].op).toBe("create");
    expect(h.writes.mock.calls[0][0].data).toMatchObject({ status: "completed" });
  });

  it("refuses to finish a company assessment early", async () => {
    const res = await POST(saveRequest({ finishedEarly: true, assignmentToken: "tok_123" }));

    expect(res.status).toBe(400);
    expect(h.writes).not.toHaveBeenCalled();
  });
});
