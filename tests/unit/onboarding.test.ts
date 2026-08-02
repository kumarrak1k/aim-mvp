/**
 * Onboarding personalisation.
 *
 * Step 4 is the reason the earlier steps do not read as a form: it repeats the
 * candidate's own answers back and commits to acting on them. If it ever
 * degrades to generic copy, the questions become pointless and the flow becomes
 * pure friction — so the specificity is asserted, not assumed.
 */
import { describe, it, expect } from "vitest";
import {
  CHALLENGES,
  CAREER_STAGES,
  SECTORS,
  PROCESS_TYPES,
  buildPlanIntro,
  buildPlanSteps,
  challengeFor,
  processTypeFor,
  ONBOARDING_STEPS,
} from "../../app/lib/onboarding";

const base = {
  role: "Operations Analyst",
  sector: "Financial services",
  stage: "Graduate / entry level",
  challenge: "wander",
};

describe("onboarding shape", () => {
  it("is five steps — three that ask, one that gives back, one that launches", () => {
    expect(ONBOARDING_STEPS).toBe(5);
  });

  it("keeps each choice set short enough to scan", () => {
    // A grid nobody reads is the same as no question at all.
    expect(CAREER_STAGES.length).toBeLessThanOrEqual(4);
    expect(CHALLENGES.length).toBeLessThanOrEqual(6);
    expect(SECTORS.length).toBeLessThanOrEqual(10);
  });

  it("gives every challenge a focus area, so the answer changes the product", () => {
    for (const c of CHALLENGES) {
      expect(c.focusArea.length).toBeGreaterThan(0);
      expect(c.coaching.length).toBeGreaterThan(0);
    }
  });

  it("phrases challenges in the candidate's voice, not the product's", () => {
    for (const c of CHALLENGES) {
      // First-person VOICE, which "Technical questions trip me up" satisfies
      // without opening with "I" — the earlier version of this test demanded
      // the prefix and so demanded worse copy.
      const words = c.label.toLowerCase().split(/[^a-z']+/);
      expect(
        words.includes("i") || words.includes("me") || words.includes("my")
      ).toBe(true);
      // Category language is what this flow exists to avoid.
      expect(c.label).not.toMatch(/select|choose|area|option|preference/i);
    }
  });

  it("gives every challenge a second-person echo for the step-4 payoff", () => {
    // Deriving one by stripping "I " off the label produced
    // "You said you Technical questions trip me up."
    for (const c of CHALLENGES) {
      expect(c.echo.length).toBeGreaterThan(0);
      expect(c.echo).not.toMatch(/^I/);
      expect(`You said you ${c.echo}.`).not.toMatch(/you [A-Z]/);
    }
  });
});

describe("buildPlanIntro", () => {
  it("names the role and the thing they said they struggle with", () => {
    const { headline, body } = buildPlanIntro(base);
    expect(body).toContain("Operations Analyst");
    expect(body).toContain("financial services");
    // Their own words, echoed back.
    expect(body).toContain("wander");
  });

  it("switches the candidate's first-person label into second person", () => {
    const { body } = buildPlanIntro(base);
    expect(body).toMatch(/you find your answers wander/i);
  });

  it("stays specific when no challenge was chosen", () => {
    const { headline, body } = buildPlanIntro({ ...base, challenge: null });
    expect(headline).toContain("Operations Analyst");
    expect(body).toContain("financial services");
  });

  it("falls back gracefully when the role is blank", () => {
    const { headline, body } = buildPlanIntro({ ...base, role: "   ", challenge: null });
    expect(headline).toContain("your target role");
    // No double spaces or stranded punctuation from an empty substitution.
    expect(`${headline} ${body}`).not.toMatch(/ {2}|\s,|\s\./);
  });

  it("produces different copy for different challenges", () => {
    const a = buildPlanIntro({ ...base, challenge: "blank" }).body;
    const b = buildPlanIntro({ ...base, challenge: "flat" }).body;
    expect(a).not.toBe(b);
  });
});

describe("buildPlanSteps", () => {
  it("always starts small, so the first session is not the full five", () => {
    expect(buildPlanSteps("wander", "interview")[0].title).toMatch(/short first session/i);
  });

  it("names the chosen focus area in the middle step", () => {
    const steps = buildPlanSteps("thin", "interview");
    expect(steps[1].title.toLowerCase()).toContain("content & evidence");
  });

  it("ends on the assessment centre when that is what they are facing", () => {
    const steps = buildPlanSteps("wander", "assessment-centre");
    expect(steps[2].title.toLowerCase()).toContain("assessment centre");
  });

  it("ends on the trend for a plain interview", () => {
    const steps = buildPlanSteps("wander", "interview");
    expect(steps[2].title.toLowerCase()).toContain("trend");
  });

  it("still returns three steps with nothing chosen", () => {
    expect(buildPlanSteps(null, null)).toHaveLength(3);
  });
});

describe("process type", () => {
  it("routes the assessment centre answer somewhere different", () => {
    // The reason this question exists: it changes where onboarding ends.
    const ac = processTypeFor("assessment-centre")?.destination;
    const interview = processTypeFor("interview")?.destination;
    expect(ac).toBe("/assessment-centre");
    expect(ac).not.toBe(interview);
  });

  it("gives every process type a destination", () => {
    for (const p of PROCESS_TYPES) {
      expect(p.destination.startsWith("/")).toBe(true);
    }
  });
});

describe("challengeFor", () => {
  it("resolves known values and rejects unknown ones", () => {
    expect(challengeFor("blank")?.focusArea).toBe("Confidence & delivery");
    expect(challengeFor("nonsense")).toBeNull();
    expect(challengeFor(null)).toBeNull();
    expect(challengeFor(undefined)).toBeNull();
  });
});
