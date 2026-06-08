/**
 * Route-handler tests for the CANDIDATE Stripe webhook (POST /api/stripe/webhook).
 *
 * Simulates Stripe delivering signed events and pins the behaviours the
 * go-live audit hardened:
 *   - signature / config failures return 4xx/5xx without writing
 *   - idempotency: a duplicate delivery does NOT re-run the handler
 *   - retry-after-failure (#3): a throwing handler RELEASES the event claim so
 *     Stripe's retry actually re-runs it
 *   - stale/out-of-order (#4): a delete for an OLD sub can't clobber newer state
 *   - routing: a corporate subscription is ignored by the candidate webhook
 *
 * Clerk, Stripe and the event store are mocked; the real stripeSync mapping runs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    event: null as unknown,
    constructThrows: false,
    recordFirstTime: true,
    updateThrows: false,
    user: { privateMetadata: {} as Record<string, unknown> },
    updates: [] as Array<{ id: string; data: Record<string, unknown> }>,
    deletedEvents: [] as string[],
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: {
      getUser: async () => h.state.user,
      updateUserMetadata: async (
        id: string,
        data: { privateMetadata: Record<string, unknown> },
      ) => {
        if (h.state.updateThrows) throw new Error("clerk down");
        h.state.updates.push({ id, data: data.privateMetadata });
        return {};
      },
    },
  }),
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

import { POST } from "@/app/api/stripe/webhook/route";

function candidateSubEvent(
  type: string,
  subOver: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "evt_1",
    type,
    data: {
      object: {
        id: "sub_x",
        customer: "cus_x",
        status: "active",
        metadata: { clerkUserId: "user_1", planId: "plus_monthly" },
        items: {
          data: [
            { price: { id: undefined, lookup_key: "plus_monthly" }, current_period_end: 1_700_000_000 },
          ],
        },
        ...subOver,
      },
    },
  };
}

function req(withSig = true) {
  return new Request("http://localhost/api/stripe/webhook", {
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
  h.state.user = { privateMetadata: {} };
  h.state.updates = [];
  h.state.deletedEvents = [];
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
});

afterEach(() => vi.unstubAllEnvs());

describe("candidate webhook — config & signature", () => {
  it("500 when the webhook secret is not configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.state.updates).toHaveLength(0);
  });

  it("400 when the stripe-signature header is missing", async () => {
    const res = await POST(req(false));
    expect(res.status).toBe(400);
  });

  it("400 when signature verification fails (no record, no write)", async () => {
    h.state.constructThrows = true;
    const res = await POST(req());
    expect(res.status).toBe(400);
    expect(h.state.updates).toHaveLength(0);
    expect(h.state.deletedEvents).toHaveLength(0);
  });
});

describe("candidate webhook — delivery semantics", () => {
  it("first delivery of subscription.created writes the mapped metadata", async () => {
    h.state.event = candidateSubEvent("customer.subscription.created");
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(1);
    expect(h.state.updates[0].data).toMatchObject({
      stripeSubscriptionId: "sub_x",
      stripePlanId: "plus_monthly",
      subscriptionStatus: "active",
    });
  });

  it("a duplicate delivery does NOT re-run the handler", async () => {
    h.state.event = candidateSubEvent("customer.subscription.created");
    h.state.recordFirstTime = false; // already processed
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { duplicate?: boolean };
    expect(body.duplicate).toBe(true);
    expect(h.state.updates).toHaveLength(0);
  });

  it("retry-after-failure (#3): a throwing handler releases the event claim and 500s", async () => {
    h.state.event = candidateSubEvent("customer.subscription.created");
    h.state.updateThrows = true;
    const res = await POST(req());
    expect(res.status).toBe(500);
    // The idempotency claim must be released so Stripe's retry re-runs it.
    expect(h.state.deletedEvents).toEqual(["evt_1"]);
  });
});

describe("candidate webhook — guards", () => {
  it("stale/out-of-order (#4): a delete for an OLD sub can't clobber the current one", async () => {
    h.state.event = candidateSubEvent("customer.subscription.deleted", { id: "sub_OLD" });
    h.state.user = {
      privateMetadata: { stripeSubscriptionId: "sub_CURRENT", subscriptionStatus: "active" },
    };
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(0); // no write — guard held
  });

  it("routing: a corporate subscription is ignored by the candidate webhook", async () => {
    h.state.event = candidateSubEvent("customer.subscription.created", {
      metadata: { companyId: "co_1", planType: "corporate" },
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.state.updates).toHaveLength(0);
  });
});
