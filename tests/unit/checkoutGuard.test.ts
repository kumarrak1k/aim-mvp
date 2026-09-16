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
    rejectDiscounts: false,
    lastParams: null as Record<string, unknown> | null,
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
  resolveProPriceId: async () => "price_x",
  normaliseCurrency: (v: unknown) => (v === "eur" || v === "usd" ? v : "gbp"),
  requireStripe: () => ({
    customers: {
      create: async () => {
        h.state.customerCreated++;
        return { id: "cus_new" };
      },
    },
    promotionCodes: {
      list: async () => ({ data: [{ id: "promo_1" }] }),
    },
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          h.state.sessionsCreated++;
          h.state.lastParams = params;
          // Stripe refuses a discount that does not apply to the line item,
          // which is what a code left over from the old tiers now does.
          if (h.state.rejectDiscounts && params.discounts) {
            throw new Error("This promotion code cannot be used on this purchase.");
          }
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
  h.state.rejectDiscounts = false;
  h.state.lastParams = null;
});

describe("checkout — validation", () => {
  it("400 for an unknown plan id", async () => {
    const res = await POST(req("bogus_plan"));
    expect(res.status).toBe(400);
    expect(h.state.sessionsCreated).toBe(0);
  });
});

describe("checkout — discount codes are monthly only", () => {
  // A 50% "first payment" code against the yearly plan is £60 off in one go,
  // which is a far bigger giveaway than the offer was meant to be. The coupon
  // itself is not restricted, so checkout is what holds the line.
  function reqWithPromo(planId: string) {
    return new Request("http://localhost/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, promoCode: "STUDENT50" }),
    }) as unknown as Parameters<typeof POST>[0];
  }

  it("applies a code on the monthly plan", async () => {
    const res = await POST(reqWithPromo("pro_monthly"));

    expect(res.status).toBe(200);
    expect(h.state.lastParams?.discounts).toEqual([{ promotion_code: "promo_1" }]);
  });

  for (const planId of ["pro_quarterly", "pro_annual"]) {
    it(`ignores a code on ${planId}, and offers no code field`, async () => {
      const res = await POST(reqWithPromo(planId));

      expect(res.status).toBe(200);
      expect(h.state.lastParams?.discounts).toBeUndefined();
      expect(h.state.lastParams?.allow_promotion_codes).toBe(false);
    });
  }
});

describe("checkout — a promo code that no longer applies", () => {
  // Old marketing links still carry ?promo=SUMMER2026, whose coupon is tied to
  // the retired Plus and Professional products. Losing the sale over a dead
  // discount would be the worst possible outcome.
  it("still opens checkout when Stripe refuses the pre-applied code", async () => {
    h.state.rejectDiscounts = true;
    const request = new Request("http://localhost/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId: "pro_monthly", promoCode: "SUMMER2026" }),
    }) as unknown as Parameters<typeof POST>[0];

    const res = await POST(request);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { url?: string };
    expect(body.url).toContain("checkout.stripe.test");
    // The retry drops the discount and lets them type a code instead.
    expect(h.state.lastParams?.discounts).toBeUndefined();
    expect(h.state.lastParams?.allow_promotion_codes).toBe(true);
  });
});

describe("checkout — double-subscribe guard (#9)", () => {
  for (const status of ["active", "trialing", "past_due"]) {
    it(`409 already_subscribed when an existing subscription is ${status}`, async () => {
      h.state.privateMetadata = { stripeSubscriptionId: "sub_1", subscriptionStatus: status };
      const res = await POST(req("pro_monthly"));
      expect(res.status).toBe(409);
      const body = (await res.json()) as { code?: string };
      expect(body.code).toBe("already_subscribed");
      expect(h.state.sessionsCreated).toBe(0); // no second subscription created
    });
  }

  it("a cancelled user can subscribe again (Checkout session created)", async () => {
    h.state.privateMetadata = { stripeSubscriptionId: "sub_old", subscriptionStatus: "cancelled" };
    const res = await POST(req("pro_monthly"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url?: string };
    expect(body.url).toContain("checkout.stripe.test");
    expect(h.state.sessionsCreated).toBe(1);
  });

  it("a brand-new free user gets a customer + Checkout session", async () => {
    h.state.privateMetadata = {};
    const res = await POST(req("pro_monthly"));
    expect(res.status).toBe(200);
    expect(h.state.customerCreated).toBe(1);
    expect(h.state.sessionsCreated).toBe(1);
  });
});
