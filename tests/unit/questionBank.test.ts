/**
 * The question bank and how a session is built from it.
 *
 * Rakesh's users said our questions are not the ones they actually get asked:
 * every one was written fresh by the model, so each was plausible and none was
 * standard. These rules decide what a session asks, so they are the part that
 * has to be right — a repeat inside one session, or a question about managing
 * a team put to a school leaver, is worse than a generated question.
 */
import { describe, it, expect } from "vitest";
import {
  QUESTION_BANK,
  BANK_COMPETENCIES,
  pickQuestion,
  questionsFor,
  levelFromExperience,
  sessionBlueprint,
  slotForQuestion,
  competenciesAsked,
  TAILORED,
} from "@/app/lib/questionBank";

describe("the bank itself", () => {
  it("is big enough to run several sessions without repeating", () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(120);
  });

  it("gives every question a unique id and some text", () => {
    const ids = new Set(QUESTION_BANK.map((q) => q.id));
    expect(ids.size).toBe(QUESTION_BANK.length);
    for (const question of QUESTION_BANK) {
      expect(question.text.length).toBeGreaterThan(15);
      expect(question.text.endsWith("?") || question.text.endsWith(".")).toBe(true);
    }
  });

  it("never repeats a question, however it is worded", () => {
    const normalised = QUESTION_BANK.map((q) =>
      q.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    );
    expect(new Set(normalised).size).toBe(normalised.length);
  });

  it("tags every competency question with a competency we know", () => {
    for (const question of QUESTION_BANK) {
      if (question.type !== "competency") continue;
      expect(BANK_COMPETENCIES).toContain(question.competency);
    }
  });

  /**
   * Success Profiles material is Open Government Licence v3: free to reuse
   * commercially, but only with attribution. An untracked source is a licence
   * problem, so the tag is not optional.
   */
  it("records where every question came from", () => {
    for (const question of QUESTION_BANK) {
      expect(["original", "ogl-success-profiles"]).toContain(question.source);
    }
  });

  it("writes in UK English", () => {
    const americanisms = /\b(organiz|recogniz|prioritiz|analyze|behavior|favor|center|program\b|realiz|apologiz)/i;
    for (const question of QUESTION_BANK) {
      expect(americanisms.test(question.text), question.text).toBe(false);
    }
  });

  it("covers every type the blueprint can ask for", () => {
    for (const type of ["opener", "motivation", "competency", "strengths", "situational", "commercial"] as const) {
      expect(questionsFor({ type }).length, type).toBeGreaterThan(3);
    }
  });
});

describe("filtering", () => {
  it("keeps sector questions as a layer on top of the core, never a replacement", () => {
    const core = questionsFor({ type: "competency" });
    const forHealthcare = questionsFor({ type: "competency", sector: "Healthcare & life sciences" });

    // Every untagged core question is still on offer.
    const untagged = core.filter((q) => !q.sectors);
    for (const question of untagged) {
      expect(forHealthcare).toContain(question);
    }
    // And something sector-specific has joined them.
    expect(forHealthcare.some((q) => q.sectors?.includes("Healthcare & life sciences"))).toBe(true);
  });

  it("drops questions written for a different sector", () => {
    const forTech = questionsFor({ type: "commercial", sector: "Technology & data" });

    for (const question of forTech) {
      if (!question.sectors) continue;
      expect(question.sectors).toContain("Technology & data");
    }
  });

  it("does not ask a school leaver about running a team", () => {
    const early = questionsFor({ type: "leadership", level: "early" });

    for (const question of early) {
      if (!question.levels) continue;
      expect(question.levels).toContain("early");
    }
  });

  it("maps the experience levels the setup screen offers onto the three it tags", () => {
    expect(levelFromExperience("Student / early career")).toBe("early");
    expect(levelFromExperience("Graduate / entry level")).toBe("graduate");
    expect(levelFromExperience("Senior / experienced professional")).toBe("experienced");
    expect(levelFromExperience("3–7 years experience")).toBe("experienced");
    // One to three years is not yet "run a team" territory.
    expect(levelFromExperience("1–3 years experience")).toBe("graduate");
    // Anything unrecognised is treated as the middle, which fits the most people.
    expect(levelFromExperience("Something else entirely")).toBe("graduate");
  });
});

describe("picking a question", () => {
  it("never returns one that has already been asked", () => {
    const asked = questionsFor({ type: "opener" }).map((q) => q.text);
    const picked = pickQuestion({ type: "opener", asked, seed: "attempt-1" });

    expect(picked).toBeNull();
  });

  it("ignores wording differences when deciding what counts as asked", () => {
    const first = questionsFor({ type: "opener" })[0];
    const shouted = `  ${first.text.toUpperCase()}  `;

    const picked = pickQuestion({ type: "opener", asked: [shouted], seed: "attempt-1" });

    expect(picked?.id).not.toBe(first.id);
  });

  it("is stable for one attempt and different for the next", () => {
    const once = pickQuestion({ type: "competency", asked: [], seed: "attempt-1" });
    const again = pickQuestion({ type: "competency", asked: [], seed: "attempt-1" });
    expect(once?.id).toBe(again?.id);

    // Across many attempts it must not always land on the same question.
    const spread = new Set(
      Array.from({ length: 25 }, (_, i) =>
        pickQuestion({ type: "competency", asked: [], seed: `attempt-${i}` })?.id
      )
    );
    expect(spread.size).toBeGreaterThan(3);
  });

  it("spreads competency questions over different competencies", () => {
    const first = pickQuestion({ type: "competency", asked: [], seed: "a" });
    const second = pickQuestion({
      type: "competency",
      asked: first ? [first.text] : [],
      usedCompetencies: first?.competency ? [first.competency] : [],
      seed: "a",
    });

    expect(second?.competency).not.toBe(first?.competency);
  });
});

describe("the session blueprint", () => {
  it("opens with the opener and asks why us second", () => {
    const shape = sessionBlueprint(5);

    expect(shape[0]).toBe("opener");
    expect(shape[1]).toBe("motivation");
  });

  it("gives the candidate exactly the number of questions they asked for", () => {
    for (const total of [3, 4, 5, 6, 8, 10]) {
      expect(sessionBlueprint(total)).toHaveLength(total);
    }
  });

  it("always includes one question written from the candidate's own CV", () => {
    for (const total of [3, 5, 8, 10]) {
      expect(sessionBlueprint(total).filter((slot) => slot === TAILORED)).toHaveLength(1);
    }
  });

  it("leans on competency questions, which is what a real screen does", () => {
    const shape = sessionBlueprint(8);

    expect(shape.filter((slot) => slot === "competency").length).toBeGreaterThanOrEqual(3);
  });

  it("only reaches for commercial awareness in a longer session", () => {
    expect(sessionBlueprint(3)).not.toContain("commercial");
    expect(sessionBlueprint(8)).toContain("commercial");
  });
});

/**
 * Which slot a given question number is, once a recruiter's or a Pro user's
 * own mix is taken into account. A mix somebody chose deliberately must always
 * win over our blueprint.
 */
describe("slotForQuestion", () => {
  it("follows the blueprint when nobody has chosen a mix", () => {
    expect(slotForQuestion({ questionNumber: 1, totalQuestions: 5 })).toBe("opener");
    expect(slotForQuestion({ questionNumber: 2, totalQuestions: 5 })).toBe("motivation");
  });

  it("obeys a mix that was actually chosen", () => {
    const questionMix = {
      opener: 0,
      competency: 0,
      technical: 2,
      leadership: 1,
      motivation: 0,
      situational: 0,
      commercial: 0,
      custom: 0,
    };

    expect(slotForQuestion({ questionNumber: 1, totalQuestions: 3, questionMix })).toBe("technical");
    expect(slotForQuestion({ questionNumber: 3, totalQuestions: 3, questionMix })).toBe("leadership");
  });

  it("leaves a verbatim custom slot alone: the bank must not answer it", () => {
    const questionMix = {
      opener: 0,
      competency: 1,
      technical: 0,
      leadership: 0,
      motivation: 0,
      situational: 0,
      commercial: 0,
      custom: 1,
    };

    expect(slotForQuestion({ questionNumber: 2, totalQuestions: 2, questionMix })).toBeNull();
  });

  it("falls back to the model when a mix runs out of slots", () => {
    const questionMix = {
      opener: 1,
      competency: 0,
      technical: 0,
      leadership: 0,
      motivation: 0,
      situational: 0,
      commercial: 0,
      custom: 0,
    };

    expect(slotForQuestion({ questionNumber: 4, totalQuestions: 4, questionMix })).toBeNull();
  });
});

describe("competenciesAsked", () => {
  it("recognises the bank questions a candidate has already had", () => {
    const teamwork = questionsFor({ type: "competency" }).find((q) => q.competency === "teamwork");

    expect(competenciesAsked([teamwork!.text.toUpperCase()])).toContain("teamwork");
  });

  it("ignores questions that never came from the bank", () => {
    expect(competenciesAsked(["Something the model made up on the spot."])).toEqual([]);
  });
});
