/**
 * Gate tests for the assessment-centre SUBMIT routes (#6).
 *
 * The three submit routes (case-study / interview / presentation) must deny a
 * caller who is not entitled BEFORE any OpenAI call, so a user who downgraded
 * or lapsed mid-flow cannot keep generating expensive AI scoring.
 *
 * "Entitled" now means Professional OR still inside the free taster allowance
 * (FREE_TIER.assessmentCentres): a non-paying candidate gets one full run so
 * they can see what the paid feature actually is. The lapsed-user protection is
 * preserved by counting sessions — somebody holding more sessions than the
 * taster allows built them on a plan they no longer have, and stays blocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    isProfessional: true,
    openAICalls: 0,
    updated: 0,
    selectedStages: ["stage1"] as string[],
    assignmentToken: null as string | null,
    /** Self-serve AC sessions this user already holds (drives the taster gate). */
    sessionCount: 1,
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
  // freeTaster reads the allowance from here — the mock must carry it too.
  FREE_TIER: { assessmentCentres: 1, careerDocs: 2, practiceSessionsPerWindow: 3, windowDays: 30 },
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
        assignmentToken: h.state.assignmentToken,
        caseStudyScenario: { company: "X" },
      }),
      update: async () => {
        h.state.updated++;
        return {};
      },
      count: async () => h.state.sessionCount,
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
  h.state.assignmentToken = null;
  h.state.sessionCount = 1;
});

describe("AC submit gate (#6) — denies a lapsed user before any AI cost", () => {
  const routes: Array<[string, (r: Request, c: ReturnType<typeof ctx>) => Promise<Response>]> = [
    ["submit-case-study", submitCaseStudy as never],
    ["submit-interview", submitInterview as never],
    ["submit-presentation", submitPresentation as never],
  ];

  for (const [name, route] of routes) {
    it(`${name}: 403 when a non-Professional holds more sessions than the taster allows`, async () => {
      h.state.isProfessional = false;
      // Built up on a plan they no longer hold — the case this gate exists for.
      h.state.sessionCount = 4;
      const res = await route(req(), ctx());
      expect(res.status).toBe(403);
      expect(h.state.openAICalls).toBe(0);
      expect(h.state.updated).toBe(0);
    });
  }
});

describe("AC submit gate — a free taster run can be completed", () => {
  it("submit-case-study: a non-Professional inside the taster allowance is scored", async () => {
    h.state.isProfessional = false;
    h.state.sessionCount = 1; // their one free run, started legitimately
    const res = await submitCaseStudy(req() as never, ctx() as never);
    expect(res.status).toBe(200);
    expect(h.state.openAICalls).toBeGreaterThan(0);
    expect(h.state.updated).toBeGreaterThan(0);
  });
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

describe("AC submit gate (#6) — COMPANY-FUNDED sessions bypass the personal plan gate", () => {
  it("a non-Professional candidate on a company-funded session is allowed", async () => {
    // A corporate invite created this session (assignmentToken set). The company
    // pays — the candidate's own Free/Plus plan must NOT block scoring, or the
    // corporate-funded assessment-centre flow breaks (regression caught by the
    // Playwright pack).
    h.state.isProfessional = false;
    h.state.assignmentToken = "invite_tok_123";
    const res = await submitCaseStudy(req() as never, ctx() as never);
    expect(res.status).toBe(200);
    expect(h.state.openAICalls).toBeGreaterThan(0);
    expect(h.state.updated).toBeGreaterThan(0);
  });
});
