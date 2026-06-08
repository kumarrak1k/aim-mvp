/**
 * Tests for the nightly Stripe -> our-stores reconciler (app/lib/stripeReconcile.ts).
 *
 * The reconciler is the unattended safety net that repairs candidate (Clerk)
 * and corporate (Company) records when a webhook was missed. It reuses the SAME
 * mapping helpers as the webhooks, so the dangerous part is its CLAIM/MUTATE
 * rules — the logic that decides whether a given Stripe subscription is allowed
 * to write a given record. A bug there could clobber a paying user. These tests
 * pin those rules, plus the planId-repair path that closes the downgrade leak.
 *
 * Clerk, Prisma and Stripe are mocked; the real stripeSync mapping runs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted above imports — share mutable state via vi.hoisted.
const h = vi.hoisted(() => {
  const state = {
    subs: [] as Array<Record<string, unknown>>,
    users: {} as Record<string, { privateMetadata: Record<string, unknown> } | undefined>,
    companies: {} as Record<string, Record<string, unknown> | undefined>,
    updatedUsers: [] as Array<{ id: string; data: Record<string, unknown> }>,
    updatedCompanies: [] as Array<{ id: string; data: Record<string, unknown> }>,
  };
  return { state };
});

vi.mock("@/app/lib/stripe", () => ({
  requireStripe: () => ({
    subscriptions: {
      list: async () => ({ data: h.state.subs, has_more: false }),
    },
  }),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: {
      getUser: async (id: string) => {
        const u = h.state.users[id];
        if (!u) throw new Error("user not found");
        return u;
      },
      updateUserMetadata: async (
        id: string,
        data: { privateMetadata: Record<string, unknown> },
      ) => {
        h.state.updatedUsers.push({ id, data: data.privateMetadata });
        return {};
      },
    },
  }),
}));

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    company: {
      findUnique: async ({ where: { id } }: { where: { id: string } }) =>
        h.state.companies[id] ?? null,
      update: async ({
        where: { id },
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        h.state.updatedCompanies.push({ id, data });
        return { id, ...data };
      },
    },
  },
}));

import { runStripeReconcile } from "@/app/lib/stripeReconcile";

type SubArgs = {
  id?: string;
  customer?: string;
  status?: string;
  metadata?: Record<string, string>;
  lookupKey?: string | null;
  periodEnd?: number | null;
};

function sub(o: SubArgs = {}): Record<string, unknown> {
  return {
    id: o.id ?? "sub_1",
    customer: o.customer ?? "cus_1",
    status: o.status ?? "active",
    metadata: o.metadata ?? {},
    items: {
      data: [
        {
          price: { id: undefined, lookup_key: o.lookupKey ?? null },
          current_period_end: o.periodEnd === undefined ? 1_900_000_000 : o.periodEnd,
        },
      ],
    },
  };
}

beforeEach(() => {
  h.state.subs = [];
  h.state.users = {};
  h.state.companies = {};
  h.state.updatedUsers = [];
  h.state.updatedCompanies = [];
});

// ─── Candidate ────────────────────────────────────────────────────────────────

describe("reconcile — candidate", () => {
  it("a LIVE subscription CLAIMS a record whose metadata is empty (missed webhook)", async () => {
    h.state.subs = [
      sub({ id: "sub_a", customer: "cus_a", metadata: { clerkUserId: "user_1" }, lookupKey: "plus_monthly" }),
    ];
    h.state.users["user_1"] = { privateMetadata: {} };

    const summary = await runStripeReconcile();

    expect(summary.candidateFixed).toBe(1);
    expect(h.state.updatedUsers).toHaveLength(1);
    expect(h.state.updatedUsers[0].data).toMatchObject({
      stripeSubscriptionId: "sub_a",
      stripePlanId: "plus_monthly",
      subscriptionStatus: "active",
    });
  });

  it("a NON-LIVE (canceled) sub may NOT clobber a record pointing at a different sub", async () => {
    h.state.subs = [
      sub({ id: "sub_new", status: "canceled", metadata: { clerkUserId: "user_2" } }),
    ];
    h.state.users["user_2"] = {
      privateMetadata: { stripeSubscriptionId: "sub_OTHER", subscriptionStatus: "active" },
    };

    const summary = await runStripeReconcile();

    expect(summary.candidateFixed).toBe(0);
    expect(h.state.updatedUsers).toHaveLength(0);
    expect(summary.skipped).toBe(1);
  });

  it("an already-in-sync record costs zero writes", async () => {
    h.state.subs = [
      sub({ id: "sub_3", customer: "cus_3", metadata: { clerkUserId: "user_3" }, lookupKey: "plus_monthly", periodEnd: 1_900_000_000 }),
    ];
    h.state.users["user_3"] = {
      privateMetadata: {
        stripeCustomerId: "cus_3",
        stripeSubscriptionId: "sub_3",
        stripePlanId: "plus_monthly",
        subscriptionStatus: "active",
        subscriptionCurrentPeriodEnd: 1_900_000_000,
      },
    };

    const summary = await runStripeReconcile();

    expect(summary.candidateFixed).toBe(0);
    expect(h.state.updatedUsers).toHaveLength(0);
  });
});

// ─── Corporate ──────────────────────────────────────────────────────────────

describe("reconcile — corporate", () => {
  const baseCompany = (over: Record<string, unknown>) => ({
    planStatus: "active",
    planId: "business",
    stripeCustomerId: "cus_c",
    stripeSubscriptionId: "sub_c",
    stripeCurrentPeriodEnd: new Date(1_800_000_000 * 1000),
    ...over,
  });

  it("repairs a stale Company.planId (the downgrade revenue leak)", async () => {
    // Stripe says Team (price lookup_key), Company still says Business.
    h.state.subs = [
      sub({ id: "sub_c", customer: "cus_c", metadata: { companyId: "co_1" }, lookupKey: "corporate_team_monthly", periodEnd: 1_800_000_000 }),
    ];
    h.state.companies["co_1"] = baseCompany({ planId: "business" });

    const summary = await runStripeReconcile();

    expect(summary.corporateFixed).toBe(1);
    expect(h.state.updatedCompanies).toHaveLength(1);
    expect(h.state.updatedCompanies[0].data).toMatchObject({ planId: "team", planStatus: "active" });
  });

  it("no write when the company already matches Stripe (planId included)", async () => {
    h.state.subs = [
      sub({ id: "sub_c", customer: "cus_c", metadata: { companyId: "co_1" }, lookupKey: "corporate_team_monthly", periodEnd: 1_800_000_000 }),
    ];
    h.state.companies["co_1"] = baseCompany({ planId: "team" });

    const summary = await runStripeReconcile();

    expect(summary.corporateFixed).toBe(0);
    expect(h.state.updatedCompanies).toHaveLength(0);
  });

  it("a canceled sub may not cancel a company that points at a different sub", async () => {
    h.state.subs = [
      sub({ id: "sub_gone", status: "canceled", metadata: { companyId: "co_2" } }),
    ];
    h.state.companies["co_2"] = baseCompany({ stripeSubscriptionId: "sub_CURRENT" });

    const summary = await runStripeReconcile();

    expect(summary.corporateFixed).toBe(0);
    expect(h.state.updatedCompanies).toHaveLength(0);
    expect(summary.skipped).toBe(1);
  });
});
