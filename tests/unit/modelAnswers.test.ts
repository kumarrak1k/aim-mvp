import { describe, it, expect } from "vitest";
import {
  applyModelAnswer,
  createModelAnswerTracker,
  type ModelAnswer,
} from "@/app/practice/session/modelAnswers";

type Row = {
  question: string;
  answer: string;
  feedback: { overall_score: number; improved_answer: string; improved_answer_star?: unknown; model_answer_loading?: boolean };
};

const row = (question: string, improved = ""): Row => ({
  question,
  answer: "my answer",
  feedback: { overall_score: 6, improved_answer: improved, model_answer_loading: !improved },
});

const answer = (text: string): ModelAnswer => ({
  improved_answer: text,
  improved_answer_star: { situation: "S", task: "T", action: "A", result: "R" } as never,
});

describe("applyModelAnswer", () => {
  it("fills in the model answer for the question it belongs to", () => {
    const rows = [row("Q1", "done"), row("Q2")];
    const next = applyModelAnswer(rows, "Q2", answer("model 2"));
    expect(next[1].feedback.improved_answer).toBe("model 2");
    expect(next[1].feedback.improved_answer_star).toBeTruthy();
    expect(next[1].feedback.model_answer_loading).toBe(false);
  });

  it("leaves other questions alone", () => {
    const rows = [row("Q1", "done"), row("Q2")];
    const next = applyModelAnswer(rows, "Q2", answer("model 2"));
    expect(next[0]).toBe(rows[0]);
  });

  it("never overwrites a model answer that is already there", () => {
    const rows = [row("Q1", "original")];
    expect(applyModelAnswer(rows, "Q1", answer("late"))[0].feedback.improved_answer).toBe("original");
  });

  it("returns the same array when nothing matched, so React skips the render", () => {
    const rows = [row("Q1", "done")];
    expect(applyModelAnswer(rows, "Q9", answer("x"))).toBe(rows);
  });
});

describe("createModelAnswerTracker", () => {
  it("completes results whose model answer arrived after the candidate moved on", async () => {
    const tracker = createModelAnswerTracker();
    let resolve!: (a: ModelAnswer) => void;
    tracker.track("Q2", new Promise((r) => (resolve = r)));

    const pending = tracker.complete([row("Q1", "done"), row("Q2")], 1000);
    resolve(answer("model 2"));
    const done = await pending;

    expect(done[1].feedback.improved_answer).toBe("model 2");
  });

  it("does not hold the report hostage to an answer that never comes", async () => {
    const tracker = createModelAnswerTracker();
    tracker.track("Q2", new Promise(() => {}));

    const started = Date.now();
    const done = await tracker.complete([row("Q2")], 50);

    expect(Date.now() - started).toBeLessThan(1000);
    expect(done[0].feedback.improved_answer).toBe("");
    expect(done[0].feedback.model_answer_loading).toBe(false);
  });

  it("treats a failed model answer as no answer rather than an error", async () => {
    const tracker = createModelAnswerTracker();
    tracker.track("Q1", Promise.reject(new Error("boom")));
    const done = await tracker.complete([row("Q1")], 1000);
    expect(done[0].feedback.improved_answer).toBe("");
  });
});
