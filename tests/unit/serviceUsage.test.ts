/**
 * What the paid services cost us.
 *
 * Rakesh needs two answers: how much is this month running at, and how close
 * is a prepaid allowance to running out. Both have to be right without him
 * logging into four dashboards, so the maths lives here where it can be
 * proved rather than in a page that renders whatever it is handed.
 */
import { describe, it, expect } from "vitest";
import {
  estimateCostPence,
  creditsRemaining,
  allowanceState,
  ELEVENLABS_PLANS,
  LOW_CREDIT_WARNING,
  LOW_CREDIT_CRITICAL,
} from "@/app/lib/serviceUsage";

describe("estimating what a call cost", () => {
  it("prices ElevenLabs on the credits the provider itself reported", () => {
    // Starter: $6 for 30,000 credits.
    const pence = estimateCostPence({ provider: "elevenlabs", credits: 30_000, plan: "starter" });

    // The whole month's allowance costs the whole month's fee.
    expect(pence).toBeGreaterThan(400);
    expect(pence).toBeLessThan(600);
  });

  it("charges nothing for a call that reported no credits", () => {
    expect(estimateCostPence({ provider: "elevenlabs", credits: 0, plan: "starter" })).toBe(0);
  });

  it("prices OpenAI speech by the characters it was given", () => {
    const pence = estimateCostPence({ provider: "openai", units: 1000, unitType: "characters" });

    expect(pence).toBeGreaterThan(0);
  });

  it("returns zero rather than guessing at a provider it does not know", () => {
    expect(estimateCostPence({ provider: "something-else", units: 500, unitType: "characters" })).toBe(0);
  });
});

describe("how much allowance is left", () => {
  it("counts down from the plan's monthly credits", () => {
    expect(creditsRemaining({ plan: "starter", creditsUsed: 4_000 })).toBe(26_000);
  });

  it("never reports less than nothing", () => {
    expect(creditsRemaining({ plan: "free", creditsUsed: 99_999 })).toBe(0);
  });

  it("knows every plan Rakesh might be on", () => {
    expect(ELEVENLABS_PLANS.free).toBe(10_000);
    expect(ELEVENLABS_PLANS.starter).toBe(30_000);
    expect(ELEVENLABS_PLANS.creator).toBe(121_000);
    expect(ELEVENLABS_PLANS.pro).toBe(600_000);
  });
});

/**
 * The alert has to arrive with time to act on it. Warning at a fifth left is
 * roughly a week's notice at a steady rate; critical at a twentieth is "do it
 * today".
 */
describe("when to raise the alarm", () => {
  it("says nothing while there is plenty left", () => {
    expect(allowanceState({ plan: "starter", creditsUsed: 1_000 })).toBe("ok");
  });

  it("warns before it becomes urgent", () => {
    const used = ELEVENLABS_PLANS.starter * (1 - LOW_CREDIT_WARNING) + 1;

    expect(allowanceState({ plan: "starter", creditsUsed: used })).toBe("low");
  });

  it("escalates when it is nearly gone", () => {
    const used = ELEVENLABS_PLANS.starter * (1 - LOW_CREDIT_CRITICAL) + 1;

    expect(allowanceState({ plan: "starter", creditsUsed: used })).toBe("critical");
  });

  it("calls it exhausted once there is nothing left", () => {
    expect(allowanceState({ plan: "starter", creditsUsed: 30_000 })).toBe("exhausted");
  });

  it("orders the thresholds so a warning always comes first", () => {
    expect(LOW_CREDIT_WARNING).toBeGreaterThan(LOW_CREDIT_CRITICAL);
  });
});
