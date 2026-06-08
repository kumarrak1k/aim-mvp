/**
 * Gate tests for the assessment-centre SUBMIT routes (#6).
 *
 * Assessment Centre is Professional-only. The start route already gated, but the
 * three submit routes (case-study / interview / presentation) did not — so a
 * user who downgraded or lapsed mid-flow could keep generating expensive AI
 * scoring. These tests prove every submit route now denies a non-Professional
 * caller BEFORE any OpenAI call, and lets a Professional through.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    isProfessional: true,
    openAICalls: 0,
    updated: 0,
    selectedStages: ["stage1"] as string[],
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
}));

vi.mock("@/app/lib/rateLimit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

vi.mock("@/app/lib/candidatePlan", () => ({
  getCandidatePlan: async () => ({ isProfessional: h.state.isProfessional, isTrial: false }),
}));

vi.mock("@/app/lib/moderation", () => ({
  moderateText: async () => ({ flagged: false }),
}));

vi.mock("@/app/lib/openai-client", () => ({
  callOpenAIChat: async () => {
    h.state.openAICalls++;
    return { choices: [{ message: { content: '{"overall": 7}' } }] };
  },
}));

vi.mock("@/app/lib/validation", () => ({
  parseJsonBody: async () => ({ data: { response: "answer", timeMs: 1000, transcript: "spoken", results: [], summary: { overall_score: 7 } } }),
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    assessmentCentreSession: {
      findUnique: async () => ({
        id: "sess_1",
        clerkUserId: "user_1",
        role: "Analyst",
        sector: "Finance",
        experienceLevel: "Graduate",
        selectedStages: h.state.selectedStages,
        caseStudyScenario: { company: "X" },
      }),
      update: async () => {
        h.state.updated++;
        return {};
      },
    },
  },
}));

import { POST as submitCaseStudy } from "@/app/api/assessment-centre/[id]/submit-case-study/route";
import { POST as submitInterview } from "@/app/api/assessment-centre/[id]/submit-interview/route";
import { POST as submitPresentation } from "@/app/api/assessment-centre/[id]/submit-presentation/route";

function ctx() {
  return { params: Promise.resolve({ id: "sess_1" }) };
}
function req() {
  return new Request("http://localhost/api/assessment-centre/sess_1/submit", {
    method: "POST",
    body: "{}",
  }) as unknown as Request;
}

beforeEach(() => {
  h.state.isProfessional = true;
  h.state.openAICalls = 0;
  h.state.updated = 0;
  h.state.selectedStages = ["stage1"];
});

describe("AC submit gate (#6) — denies non-Professional before any AI cost", () => {
  const routes: Array<[string, (r: Request, c: ReturnType<typeof ctx>) => Promise<Response>]> = [
    ["submit-case-study", submitCaseStudy as never],
    ["submit-interview", submitInterview as never],
    ["submit-presentation", submitPresentation as never],
  ];

  for (const [name, route] of routes) {
    it(`${name}: 403 for a non-Professional, no OpenAI call`, async () => {
      h.state.isProfessional = false;
      const res = await route(req(), ctx());
      expect(res.status).toBe(403);
      expect(h.state.openAICalls).toBe(0);
      expect(h.state.updated).toBe(0);
    });
  }
});

describe("AC submit gate (#6) — lets a Professional through", () => {
  it("submit-case-study (stage 1 only): scores via OpenAI and persists", async () => {
    h.state.isProfessional = true;
    const res = await submitCaseStudy(req() as never, ctx() as never);
    expect(res.status).toBe(200);
    expect(h.state.openAICalls).toBeGreaterThan(0);
    expect(h.state.updated).toBeGreaterThan(0);
  });
});
