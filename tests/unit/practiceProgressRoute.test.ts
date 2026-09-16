/**
 * PUT /api/practice-sessions/progress — saves an interview as it happens.
 *
 * Until now a session existed only once every question was answered, so anyone
 * who left part way lost everything and appeared never to have practised. This
 * route upserts one row per attempt as each answer is scored.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/** Stands in for Prisma's P2002 on (clerkUserId, attemptId). */
class PrismaUniqueError extends Error {
  code = "P2002";
  constructor() {
    super("Unique constraint failed on the fields: (`clerkUserId`,`attemptId`)");
  }
}

const h = vi.hoisted(() => ({
  state: {
    existing: null as null | Record<string, unknown>,
    countAnswered: 0,
    /** Set to make the next create() lose a race, as Postgres does. */
    createConflicts: false,
  },
  upsert: vi.fn(),
  record: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/app/lib/candidatePlan", () => ({
  getCandidatePlan: async () => ({
    isTrial: false,
    isUnlimited: false,
    planName: "Free",
    effectivePlan: "free",
    trialStartedAt: null,
  }),
  TRIAL_USAGE_CAPS: { practiceSessions: 15, assessmentCentres: 2, careerDocs: 5 },
  FREE_TIER: { practiceSessionsPerWindow: 3, windowDays: 30, assessmentCentres: 1, careerDocs: 2 },
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    practiceSession: {
      findFirst: async () => h.state.existing,
      count: async () => h.state.countAnswered,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        h.upsert({ op: "create", data });
        if (h.state.createConflicts) {
          h.state.createConflicts = false;
          // The winner's row now exists, which is what the loser must find.
          h.state.existing = { id: "sess_race", status: "in_progress", answeredCount: 1 };
          throw new PrismaUniqueError();
        }
        return { id: "sess_new", ...data };
      },
      update: async (args: Record<string, unknown>) => {
        h.upsert({ op: "update", args });
        return { id: "sess_1", ...(args.data as Record<string, unknown>) };
      },
    },
  },
}));

vi.mock("@/app/lib/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/activity")>()),
  recordActivity: h.record,
}));

import { PUT } from "@/app/api/practice-sessions/progress/route";

function progressRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/practice-sessions/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: "att_1",
      role: "Graduate analyst",
      experienceLevel: "Graduate / entry level",
      interviewType: "Competency / behavioural",
      difficulty: "Standard",
      focusArea: "Balanced",
      practiceMode: "typed",
      totalQuestions: 5,
      config: { role: "Graduate analyst", speakerEnabled: false, cameraEnabled: false },
      results: [{ question: "Q1", answer: "A1" }],
      ...body,
    }),
  }) as unknown as Parameters<typeof PUT>[0];
}

describe("PUT /api/practice-sessions/progress", () => {
  beforeEach(() => {
    h.state.existing = null;
    h.state.countAnswered = 0;
    h.upsert.mockReset();
    h.record.mockReset();
  });

  it("creates an in-progress row with the answer count on the first answer", async () => {
    const res = await PUT(progressRequest({}));

    expect(res.status).toBe(200);
    const call = h.upsert.mock.calls[0][0];
    expect(call.op).toBe("create");
    expect(call.data).toMatchObject({
      clerkUserId: "user_1",
      attemptId: "att_1",
      status: "in_progress",
      answeredCount: 1,
      totalQuestions: 5,
    });
  });

  it("updates the existing row as more answers arrive", async () => {
    h.state.existing = { id: "sess_1", status: "in_progress", answeredCount: 1, results: [{}] };

    const res = await PUT(
      progressRequest({
        results: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
        ],
      })
    );

    expect(res.status).toBe(200);
    const call = h.upsert.mock.calls[0][0];
    expect(call.op).toBe("update");
    expect((call.args.data as Record<string, unknown>).answeredCount).toBe(2);
  });

  it("refuses to shrink the saved answers (409), so a stale tab cannot wipe progress", async () => {
    h.state.existing = { id: "sess_1", status: "in_progress", answeredCount: 3, results: [{}, {}, {}] };

    const res = await PUT(progressRequest({ results: [{ question: "Q1", answer: "A1" }] }));

    expect(res.status).toBe(409);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("refuses to reopen an interview that already finished (409)", async () => {
    h.state.existing = { id: "sess_1", status: "completed", answeredCount: 5, results: [{}] };

    const res = await PUT(progressRequest({}));

    expect(res.status).toBe(409);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("rejects company assessment interviews (400): those are not saved part way", async () => {
    const res = await PUT(progressRequest({ config: { assessmentMode: true } }));

    expect(res.status).toBe(400);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  /**
   * Two answers finishing at once both saw no row and both inserted. One of
   * them got a Prisma unique-constraint error, which surfaced as a 500 and lost
   * that answer. The loser of the race now updates the row the winner made.
   */
  it("saves the answer when two writes race to create the same attempt", async () => {
    h.state.createConflicts = true;
    h.state.existing = null;

    const res = await PUT(
      progressRequest({
        results: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
        ],
      })
    );

    expect(res.status).toBe(200);
    const ops = h.upsert.mock.calls.map((c) => c[0].op);
    expect(ops).toEqual(["create", "update"]);
  });

  it("applies the plan cap when starting a new interview", async () => {
    h.state.countAnswered = 3; // free tier allows 3 per window

    const res = await PUT(progressRequest({}));

    expect(res.status).toBe(429);
    expect(h.upsert).not.toHaveBeenCalled();
  });
});
