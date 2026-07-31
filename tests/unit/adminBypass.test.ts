/**
 * The admin bypass cookie is what makes arming ADMIN_ALLOWED_IPS safe, so its
 * failure modes matter: a forgeable or non-expiring token would quietly turn
 * the allowlist into decoration.
 */
import { describe, it, expect } from "vitest";
import {
  createBypassToken,
  isValidBypassToken,
  timingSafeEqual,
  BYPASS_DAYS,
} from "../../app/lib/adminBypass";

const SECRET = "test-secret-do-not-use-in-production";
const future = () => Date.now() + BYPASS_DAYS * 24 * 60 * 60 * 1000;

describe("adminBypass — token round trip", () => {
  it("accepts a token it just issued", async () => {
    const token = await createBypassToken(SECRET, future());
    expect(await isValidBypassToken(SECRET, token)).toBe(true);
  });

  it("rejects a token signed with a different secret (rotation revokes devices)", async () => {
    const token = await createBypassToken(SECRET, future());
    expect(await isValidBypassToken("rotated-secret", token)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await createBypassToken(SECRET, Date.now() - 1000);
    expect(await isValidBypassToken(SECRET, token)).toBe(false);
  });

  it("rejects an extended expiry — the signature covers it", async () => {
    const token = await createBypassToken(SECRET, future());
    const sig = token.slice(token.indexOf(".") + 1);
    const forged = `${Date.now() + 10 * 365 * 24 * 60 * 60 * 1000}.${sig}`;
    expect(await isValidBypassToken(SECRET, forged)).toBe(false);
  });

  it("rejects malformed, empty and missing tokens", async () => {
    for (const bad of ["", ".", "abc", "123456", ".sig", "123.", undefined, null]) {
      expect(await isValidBypassToken(SECRET, bad as string)).toBe(false);
    }
  });

  it("rejects everything when no secret is configured", async () => {
    const token = await createBypassToken(SECRET, future());
    expect(await isValidBypassToken("", token)).toBe(false);
  });

  it("never emits the raw secret in the cookie value", async () => {
    const token = await createBypassToken(SECRET, future());
    expect(token).not.toContain(SECRET);
  });
});

describe("adminBypass — timingSafeEqual", () => {
  it("matches identical strings and rejects differing ones", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});
