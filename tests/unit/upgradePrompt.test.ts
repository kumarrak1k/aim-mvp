import { describe, it, expect } from "vitest";
import { shouldRedirectToUpgrade, trialHasLapsed } from "@/app/lib/upgradePrompt";

const lapsed = { isPaid: false, isTrial: false, isComp: false, trialConsumed: true };

describe("trialHasLapsed", () => {
  it("is true once a used trial has ended with nothing paid", () => {
    expect(trialHasLapsed(lapsed)).toBe(true);
  });
  it("is false while the trial is running", () => {
    expect(trialHasLapsed({ ...lapsed, isTrial: true })).toBe(false);
  });
  it("is false for subscribers and complimentary accounts", () => {
    expect(trialHasLapsed({ ...lapsed, isPaid: true })).toBe(false);
    expect(trialHasLapsed({ ...lapsed, isComp: true })).toBe(false);
  });
  it("is false for an account that never had a trial", () => {
    expect(trialHasLapsed({ ...lapsed, trialConsumed: false })).toBe(false);
  });
});

describe("shouldRedirectToUpgrade", () => {
  it("sends a lapsed trial to the upgrade page on the first page of a visit", () => {
    expect(shouldRedirectToUpgrade(lapsed, "/practice", false)).toBe(true);
  });
  it("asks once per visit, so saved reports stay reachable", () => {
    expect(shouldRedirectToUpgrade(lapsed, "/practice", true)).toBe(false);
  });
  it("never redirects away from paying, the upgrade page itself, or billing", () => {
    for (const path of ["/upgrade", "/pricing", "/account/plan", "/for-candidates/auth-complete"]) {
      expect(shouldRedirectToUpgrade(lapsed, path, false)).toBe(false);
    }
  });
  it("never interrupts an interview or an assessment in progress", () => {
    expect(shouldRedirectToUpgrade(lapsed, "/practice/session", false)).toBe(false);
    expect(shouldRedirectToUpgrade(lapsed, "/assessment-centre/abc/stage-2", false)).toBe(false);
  });
  it("leaves everyone else alone", () => {
    expect(shouldRedirectToUpgrade({ ...lapsed, isPaid: true }, "/practice", false)).toBe(false);
    expect(shouldRedirectToUpgrade({ ...lapsed, isTrial: true }, "/practice", false)).toBe(false);
  });
});
