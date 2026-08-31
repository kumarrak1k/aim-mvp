import { describe, expect, it } from "vitest";
import {
  ACTIVATIONS_PER_REWARD,
  REWARD_MONTHS_CAP,
  earnedMonths,
} from "@/app/lib/referralMath";

describe("earnedMonths", () => {
  it("grants nothing below the first threshold", () => {
    expect(earnedMonths(0)).toBe(0);
    expect(earnedMonths(ACTIVATIONS_PER_REWARD - 1)).toBe(0);
  });

  it("grants one month per full block of activations", () => {
    expect(earnedMonths(ACTIVATIONS_PER_REWARD)).toBe(1);
    expect(earnedMonths(ACTIVATIONS_PER_REWARD * 2 - 1)).toBe(1);
    expect(earnedMonths(ACTIVATIONS_PER_REWARD * 2)).toBe(2);
  });

  it("caps at the lifetime maximum", () => {
    expect(earnedMonths(ACTIVATIONS_PER_REWARD * REWARD_MONTHS_CAP)).toBe(REWARD_MONTHS_CAP);
    expect(earnedMonths(1000)).toBe(REWARD_MONTHS_CAP);
  });

  it("never goes negative on bad input", () => {
    expect(earnedMonths(-5)).toBe(0);
  });
});
