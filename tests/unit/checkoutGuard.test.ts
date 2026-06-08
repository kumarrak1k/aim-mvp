/**
 * Gate tests for the candidate Stripe checkout route (POST /api/stripe/checkout).
 *
 * Focus: the double-subscribe guard (#9). A user who already has a live
 * subscription (active / trialing / past_due) must be sent to the billing portal
 * to change plans — creating a second Checkout would bill them twice. A free /
 * cancelled user falls through to a normal Checkout session.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  state: {
    privateMetadata: {} as Record<string, unknown>,
    customerCreated: 0,
    sessionsCreated: 0,
    metadataUpdated: 0,
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_1" }),
  clerkClient: async () => ({
    users: {
      getUser: async () => ({
        emailAddresses: [{ emailAddress: "a@b.com" }],
        privateMetadata: h.state.privateMetadata,
      }),
      updateUserMetadata: async () => {
        h.state.metadataUpdated++;
        return {};
      },
    },
  }),
}));

vi.mock("@/app/lib/stripe", () => ({
  getStripePriceId: () => "price_x",
  requireStripe: () => ({
    customers: {
      create: async () => {
        h.state.customerCreated++;
        return { id: "cus_new" };
      },
    },
    checkout: {
      sessions: {
        create: async () => {
          h.state.sessionsCreated++;
          return { url: "https://checkout.stripe.test/session" };
        },
      },
    },
  }),
}));

import { POST } from "@/app/api/stripe/checkout/route";

function req(planId: unknown) {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ planId }),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  h.state.privateMetadata = {};
  h.state.customerCreated = 0;
  h.state.sessionsCreated = 0;
  h.state.metadataUpdated = 0;
});

describe("checkout — validation", () => {
  it("400 for an unknown plan id", async () => {
    const res = await POST(req("bogus_plan"));
    expect(res.status).toBe(400);
    expect(h.state.sessionsCreated).toBe(0);
  });
});

describe("checkout — double-subscribe guard (#9)", () => {
  for (const status of ["active", "trialing", "past_due"]) {
    it(`409 already_subscribed when an existing subscription is ${status}`, async () => {
      h.state.privateMetadata = { stripeSubscriptionId: "sub_1", subscriptionStatus: status };
      const res = await POST(req("plus_monthly"));
      expect(res.status).toBe(409);
      const body = (await res.json()) as { code?: string };
      expect(body.code).toBe("already_subscribed");
      expect(h.state.sessionsCreated).toBe(0); // no second subscription created
    });
  }

  it("a cancelled user can subscribe again (Checkout session created)", async () => {
    h.state.privateMetadata = { stripeSubscriptionId: "sub_old", subscriptionStatus: "cancelled" };
    const res = await POST(req("plus_monthly"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url?: string };
    expect(body.url).toContain("checkout.stripe.test");
    expect(h.state.sessionsCreated).toBe(1);
  });

  it("a brand-new free user gets a customer + Checkout session", async () => {
    h.state.privateMetadata = {};
    const res = await POST(req("plus_monthly"));
    expect(res.status).toBe(200);
    expect(h.state.customerCreated).toBe(1);
    expect(h.state.sessionsCreated).toBe(1);
  });
});
