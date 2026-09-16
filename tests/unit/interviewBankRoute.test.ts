/**
 * /api/interview answers from the question bank where it can.
 *
 * Every question used to be written fresh by the model, which is why none of
 * them were the standard ones candidates actually get asked. The bank now
 * fills the ordinary slots; the model is kept for the question that should
 * come from this candidate's own CV, for a recruiter's assessment, and for
 * whenever the bank has nothing left to offer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const profile = {
    cvText: "",
    currentRole: "",
    roleSpec: "",
    interviewGoals: "",
    cvFileName: "",
    roleSpecFileName: "",
    targetSector: "Technology & data",
    defaultExperienceLevel: "Graduate / entry level",
    updatedAt: "",
  };
  return {
    profile,
    priorSessions: [] as Array<{ results: unknown }>,
    callOpenAIChat: vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify({ question: "A model-written question?" }) } }],
    })),
    record: vi.fn(),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1", sessionClaims: null }),
}));

vi.mock("@/app/lib/rateLimit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: { practiceSession: { findMany: async () => h.priorSessions } },
}));

vi.mock("@/app/lib/openai-client", () => ({
  OpenAIError: class extends Error {
    status = 500;
  },
  callOpenAIChat: h.callOpenAIChat,
}));

vi.mock("@/app/lib/candidateProfile", () => ({
  getCandidateProfile: async () => h.profile,
  EMPTY_PROFILE: h.profile,
}));

vi.mock("@/app/lib/candidatePlan", () => ({
  resolveCandidatePlanFromClaims: () => ({ effectivePlan: "pro", isTrial: false }),
}));

vi.mock("@/app/lib/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/activity")>()),
  recordActivity: h.record,
}));

import { POST } from "@/app/api/interview/route";
import { QUESTION_BANK, questionsFor } from "@/app/lib/questionBank";

function interviewRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "Graduate analyst",
      questionNumber: 1,
      totalQuestions: 5,
      history: [],
      attemptId: "attempt-1",
      ...body,
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

const bankTexts = new Set(QUESTION_BANK.map((q) => q.text));

describe("POST /api/interview with the bank", () => {
  beforeEach(() => {
    h.priorSessions = [];
    h.callOpenAIChat.mockClear();
    h.record.mockClear();
  });

  it("opens with a banked opener and never troubles the model", async () => {
    const res = await POST(interviewRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(questionsFor({ type: "opener" }).map((q) => q.text)).toContain(body.question);
    expect(h.callOpenAIChat).not.toHaveBeenCalled();
  });

  it("gives the same attempt the same question twice", async () => {
    const first = await (await POST(interviewRequest({}))).json();
    const second = await (await POST(interviewRequest({}))).json();

    expect(second.question).toBe(first.question);
  });

  it("never repeats a question already asked in this session", async () => {
    const openers = questionsFor({ type: "opener" }).map((q) => q.text);
    const history = openers.map((question) => ({ question, answer: "An answer." }));

    // Every opener is used up, so the model has to write this one.
    const body = await (await POST(interviewRequest({ history }))).json();

    expect(openers).not.toContain(body.question);
    expect(h.callOpenAIChat).toHaveBeenCalled();
  });

  it("never repeats a question from the candidate's earlier sessions", async () => {
    const openers = questionsFor({ type: "opener" });
    h.priorSessions = [{ results: [{ question: openers[0].text, answer: "An answer." }] }];

    const body = await (await POST(interviewRequest({}))).json();

    expect(body.question).not.toBe(openers[0].text);
  });

  it("asks the model for the tailored slot, which is the point of having a CV", async () => {
    // Question 4 of 5 is the tailored slot in the blueprint.
    const body = await (await POST(interviewRequest({ questionNumber: 4 }))).json();

    expect(h.callOpenAIChat).toHaveBeenCalled();
    expect(bankTexts.has(body.question)).toBe(false);
  });

  it("leaves a recruiter's assessment to the model, so candidates stay comparable", async () => {
    await POST(
      interviewRequest({
        assessmentMode: true,
        templateContext: { templateName: "Grad scheme", companyName: "Acme" },
      })
    );

    expect(h.callOpenAIChat).toHaveBeenCalled();
  });

  it("obeys a question mix the candidate chose", async () => {
    const body = await (
      await POST(
        interviewRequest({
          questionNumber: 1,
          totalQuestions: 3,
          questionMix: {
            opener: 0,
            competency: 0,
            technical: 3,
            leadership: 0,
            motivation: 0,
            situational: 0,
            commercial: 0,
            custom: 0,
          },
        })
      )
    ).json();

    expect(questionsFor({ type: "technical" }).map((q) => q.text)).toContain(body.question);
  });
});
