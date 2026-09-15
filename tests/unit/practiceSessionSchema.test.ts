/**
 * The saved-session schema must carry the client's attemptId.
 *
 * zod objects strip unknown keys by default, so without an explicit field the
 * attemptId the session page sends would silently vanish on every save, and
 * practice_completed could never be joined to its practice_started and
 * practice_answered events.
 */
import { describe, it, expect } from "vitest";
import { practiceSessionCreateSchema } from "@/app/lib/validation";

const validSave = {
  role: "Graduate analyst",
  experienceLevel: "Graduate / entry level",
  interviewType: "Competency / behavioural",
  difficulty: "Standard",
  focusArea: "Balanced",
  practiceMode: "typed",
  totalQuestions: 3,
  summary: { overall_score: 7 },
  results: [{ question: "Q1", answer: "A1" }],
};

describe("practiceSessionCreateSchema attemptId", () => {
  it("keeps the attempt id so a saved session can be joined to its progress events", () => {
    const parsed = practiceSessionCreateSchema.parse({ ...validSave, attemptId: "att_1" });

    expect((parsed as { attemptId?: string }).attemptId).toBe("att_1");
  });

  it("rejects an attempt id longer than 64 characters", () => {
    const result = practiceSessionCreateSchema.safeParse({
      ...validSave,
      attemptId: "x".repeat(65),
    });

    expect(result.success).toBe(false);
  });
});
