/**
 * The preferred interview format is a stored default.
 *
 * Rakesh's rule for Phase 2 was "ask them and allow them to change later", so
 * the answer has to survive on the profile rather than only in the session
 * config. Two things must hold: an existing profile row that predates the
 * column reads back as the coaching flow, and a saved choice comes back
 * exactly as chosen. Anything else is silently ignored, because the value
 * arrives from the browser.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const row = {
    clerkUserId: "user_1",
    cvText: "",
    currentRole: null as string | null,
    roleSpec: "",
    interviewGoals: "",
    cvFileName: "",
    roleSpecFileName: "",
    preferredPracticeMode: "typed",
    preferredInterviewFormat: "traditional",
    speakerPreference: { voice: "female", pace: "natural" },
    defaultExperienceLevel: "Graduate / entry level",
    defaultInterviewType: "Competency / behavioural",
    defaultDifficulty: "Standard",
    defaultFocusArea: "Balanced",
    defaultTotalQuestions: 5,
    defaultUseHybridMix: false,
    defaultQuestionMix: null,
    updatedAt: new Date("2026-09-16T08:00:00Z"),
  };
  return {
    row,
    findUnique: vi.fn(),
    upsert: vi.fn(),
  };
});

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: h.findUnique,
      upsert: h.upsert,
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser: async () => ({ privateMetadata: {} }) } }),
}));

import {
  getCandidateProfile,
  upsertCandidateProfile,
  EMPTY_PROFILE,
} from "@/app/lib/candidateProfile";

describe("candidate profile interview format", () => {
  beforeEach(() => {
    h.findUnique.mockReset();
    h.upsert.mockReset();
  });

  it("defaults to the coaching flow for a profile written before the column existed", async () => {
    h.findUnique.mockResolvedValue({ ...h.row, preferredInterviewFormat: undefined });

    const profile = await getCandidateProfile("user_1");

    expect(profile.preferredInterviewFormat).toBe("traditional");
    expect(EMPTY_PROFILE.preferredInterviewFormat).toBe("traditional");
  });

  it("saves and reads back a one-way video preference", async () => {
    h.findUnique.mockResolvedValue(h.row);
    h.upsert.mockImplementation(async ({ update }: { update: Record<string, unknown> }) => ({
      ...h.row,
      ...update,
    }));

    const profile = await upsertCandidateProfile("user_1", {
      preferredInterviewFormat: "one_way_video",
    });

    expect(h.upsert.mock.calls[0][0].update.preferredInterviewFormat).toBe("one_way_video");
    expect(profile.preferredInterviewFormat).toBe("one_way_video");
  });

  it("ignores a format that does not exist", async () => {
    h.findUnique.mockResolvedValue({ ...h.row, preferredInterviewFormat: "one_way_video" });
    h.upsert.mockImplementation(async ({ update }: { update: Record<string, unknown> }) => ({
      ...h.row,
      ...update,
    }));

    // @ts-expect-error deliberately not a valid format: this is what a tampered request sends.
    const profile = await upsertCandidateProfile("user_1", { preferredInterviewFormat: "hologram" });

    expect(profile.preferredInterviewFormat).toBe("one_way_video");
  });
});
