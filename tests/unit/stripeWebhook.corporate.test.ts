/**
 * Route-handler tests for the CORPORATE Stripe webhook (POST /api/webhooks/stripe).
 *
 * Mirrors the candidate webhook tests for the Company-record path:
 *   - first delivery writes corporateUpsertData (incl. the live-price planId)
 *   - idempotency: duplicates don't re-run
 *   - stale/out-of-order (#4): a non-live event / a delete for a replaced sub
 *     can't clobber a company that points at a newer subscription
 *   - retry-after-failure (#3): a throwing handler releases the event claim
 *
 * Prisma, Stripe and the event store are mocked; the real stripeSync mapping runs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    event: null as unknown,
    constructThrows: false,
    recordFirstTime: true,
    updateThrows: false,
    company: null as Record<string, unknown> | null,
    updates: [] as Array<{ id: string; data: Record<string, unknown> }>,
    deletedEvents: [] as string[],
  },
}));

vi.mock("@/app/lib/prisma", () => ({
  // Cold-start guard called before the first DB write; a no-op in tests.
  warmDb: async () => {},
  prisma: {
    company: {
      findUnique: async () => h.state.company,
      update: async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        if (h.state.updateThrows) throw new Error("db down");
        h.state.updates.push({ id, data });
        return { id, ...data };
      },
    },
  },
}));

vi.mock("@/app/lib/stripe", () => ({
  requireStripe: () => ({
    webhooks: {
      constructEvent: () => {
        if (h.state.constructThrows) throw new Error("bad signature");
        return h.state.event;
      },
    },
    subscriptions: { retrieve: async () => h.state.event },
  }),
}));

vi.mock("@/app/lib/stripeEvents", () => ({
  recordStripeEvent: async () => ({ firstTime: h.state.recordFirstTime }),
  deleteStripeEvent: async (id: string) => {
    h.state.deletedEvents.push(id);
  },
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function corpSubEvent(type: string, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "evt_c",
    type,
    data: {
      object: {
        id: "sub_c",
        customer: "cus_c",
        status: "active",
        metadata: { companyId: "co_1", planType: "corporate" },
        items: {
          data: [
            { price: { id: undefined, lookup_key: "corporate_business_monthly" }, current_period_end: 1_800_000_000 },
          ],
        },
        ...over,
      },
    },
  };
}

function req(withSig = true) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: withSig ? { "stripe-signature": "sig_test" } : {},
    body: "raw-body",
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  h.state.event = null;
  h.state.constructThrows = false;
  h.state.recordFirstTime = true;
  h.state.updateThrows = false;
  h.state.company = { id: "co_1", stripeSubscriptionId: "sub_c", planId: "team", planStatus: "active" };
  h.state.updates = [];
  h.state.deletedEvents = [];
  vi.stubEnv("STRIPE_WEBHOOK_SECRET_CORPORATE", "whsec_corp");
});

afterEach(() => vi.unstubAllEnvs());

describe("corporate webhook — delivery semantics", () => {
  it("first delivery of subscription.updated writes planId from the live price", async () => {
    h.state.event = corpSubEvent("customer.subscription.updated");
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(1);
    expect(h.state.updates[0].data).toMatchObject({ planId: "business", planStatus: "active" });
  });

  it("a duplicate delivery does NOT re-run the handler", async () => {
    h.state.event = corpSubEvent("customer.subscription.updated");
    h.state.recordFirstTime = false;
    const res = await POST(req());
    const body = (await res.json()) as { duplicate?: boolean };
    expect(body.duplicate).toBe(true);
    expect(h.state.updates).toHaveLength(0);
  });

  it("retry-after-failure (#3): a throwing handler releases the event claim and 500s", async () => {
    h.state.event = corpSubEvent("customer.subscription.updated");
    h.state.updateThrows = true;
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.state.deletedEvents).toEqual(["evt_c"]);
  });
});

describe("corporate webhook — guards", () => {
  it("stale (#4): a non-live update for a replaced sub does not clobber the company", async () => {
    h.state.event = corpSubEvent("customer.subscription.updated", { id: "sub_OLD", status: "canceled" });
    // company points at a DIFFERENT (current) subscription
    h.state.company = { id: "co_1", stripeSubscriptionId: "sub_CURRENT", planId: "team", planStatus: "active" };
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(0);
  });

  it("a delete only cancels the company that points at THIS subscription", async () => {
    h.state.event = corpSubEvent("customer.subscription.deleted", { id: "sub_gone" });
    h.state.company = { id: "co_1", stripeSubscriptionId: "sub_CURRENT" };
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(0); // not the current sub — ignored
  });

  it("a delete for the CURRENT sub cancels the plan (period-end preserved)", async () => {
    h.state.event = corpSubEvent("customer.subscription.deleted", { id: "sub_c", periodEnd: 1_800_000_000 });
    h.state.company = { id: "co_1", stripeSubscriptionId: "sub_c" };
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(1);
    expect(h.state.updates[0].data).toMatchObject({ planStatus: "cancelled" });
    expect(h.state.updates[0].data.stripeCurrentPeriodEnd).toEqual(new Date(1_800_000_000 * 1000));
  });

  it("missing companyId metadata is ignored (no write)", async () => {
    h.state.event = corpSubEvent("customer.subscription.updated", { metadata: { planType: "corporate" } });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(0);
  });
});
