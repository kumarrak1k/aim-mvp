/**
 * Tests for the no-card trial anti-abuse layer (app/lib/trialEligibility.ts).
 *
 * Two guarantees matter:
 *  1. One human can't farm trials with +tag / dotted / disposable emails — the
 *     normalized email is hashed, so equivalents collide on the unique index.
 *  2. A claim that does NOT result in a started trial is RELEASED, so a transient
 *     failure never permanently burns a legitimate user's one free trial (#5).
 *
 * Prisma is mocked; the real crypto/normalization runs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    creates: [] as Array<{ emailHash: string; clerkUserId: string }>,
    deletes: [] as Array<{ emailHash?: string; clerkUserId?: string }>,
    failNextCreate: false,
  },
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    trialGrant: {
      create: async ({ data }: { data: { emailHash: string; clerkUserId: string } }) => {
        if (h.state.failNextCreate) throw new Error("unique constraint");
        h.state.creates.push(data);
        return { id: "tg_1", ...data };
      },
      deleteMany: async ({ where }: { where: { emailHash?: string; clerkUserId?: string } }) => {
        h.state.deletes.push(where);
        return { count: 1 };
      },
    },
  },
}));

import {
  claimTrialEligibility,
  releaseTrialEligibility,
  isDisposableEmail,
} from "@/app/lib/trialEligibility";

beforeEach(() => {
  h.state.creates = [];
  h.state.deletes = [];
  h.state.failNextCreate = false;
});

describe("isDisposableEmail", () => {
  it("flags known disposable domains, allows real ones", () => {
    expect(isDisposableEmail("a@mailinator.com")).toBe(true);
    expect(isDisposableEmail("a@yopmail.com")).toBe(true);
    expect(isDisposableEmail("real.person@gmail.com")).toBe(false);
    expect(isDisposableEmail("hire@acme.co.uk")).toBe(false);
  });
});

describe("claimTrialEligibility", () => {
  it("rejects an empty email without touching the DB", async () => {
    const r = await claimTrialEligibility("user_1", "");
    expect(r).toEqual({ eligible: false, reason: "no_email" });
    expect(h.state.creates).toHaveLength(0);
  });

  it("rejects a disposable email", async () => {
    const r = await claimTrialEligibility("user_1", "burner@mailinator.com");
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("disposable_email");
    expect(h.state.creates).toHaveLength(0);
  });

  it("claims a fresh email (creates the grant row)", async () => {
    const r = await claimTrialEligibility("user_1", "alice@example.com");
    expect(r).toEqual({ eligible: true });
    expect(h.state.creates).toHaveLength(1);
    expect(h.state.creates[0].clerkUserId).toBe("user_1");
    expect(h.state.creates[0].emailHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects when the grant already exists (unique violation)", async () => {
    h.state.failNextCreate = true;
    const r = await claimTrialEligibility("user_2", "alice@example.com");
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("email_already_trialed");
  });

  it("normalizes +tag and gmail dots so equivalents collide on the same hash", async () => {
    await claimTrialEligibility("user_a", "a.l.i.c.e+promo@gmail.com");
    await claimTrialEligibility("user_b", "alice@gmail.com");
    expect(h.state.creates).toHaveLength(2);
    // Same human → identical normalized-email hash → the real unique index would
    // reject the second; here we assert the hashes match.
    expect(h.state.creates[0].emailHash).toBe(h.state.creates[1].emailHash);
  });
});

describe("releaseTrialEligibility", () => {
  it("deletes exactly the (emailHash, clerkUserId) row the claim created", async () => {
    await claimTrialEligibility("user_1", "bob@example.com");
    const created = h.state.creates[0];

    await releaseTrialEligibility("user_1", "bob@example.com");

    expect(h.state.deletes).toHaveLength(1);
    expect(h.state.deletes[0]).toEqual({
      emailHash: created.emailHash,
      clerkUserId: "user_1",
    });
  });

  it("is a no-op for an empty email (never issues a broad delete)", async () => {
    await releaseTrialEligibility("user_1", "");
    expect(h.state.deletes).toHaveLength(0);
  });
});
