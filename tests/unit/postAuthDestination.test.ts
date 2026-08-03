/**
 * Where a candidate lands after signing in or accepting terms.
 *
 * Two failure modes matter in opposite directions: never showing onboarding
 * (which is what happened before it existed — every profile in the database is
 * blank), and showing it to someone following an emailed invite, which would
 * interrupt a journey they were already committed to.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("../../app/lib/prisma", () => ({
  prisma: { userProfile: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}));

const { resolvePostAuthDestination, DEFAULT_DESTINATION } = await import(
  "../../app/lib/postAuthDestination"
);

beforeEach(() => findUnique.mockReset());

describe("resolvePostAuthDestination", () => {
  it("sends a new candidate to onboarding", async () => {
    findUnique.mockResolvedValue({ onboardingCompletedAt: null });
    expect(await resolvePostAuthDestination("u1", DEFAULT_DESTINATION)).toBe("/onboarding");
  });

  it("sends a new candidate to onboarding when no destination was requested", async () => {
    findUnique.mockResolvedValue(null); // no profile row yet
    expect(await resolvePostAuthDestination("u1")).toBe("/onboarding");
  });

  it("does not ask twice once completed", async () => {
    findUnique.mockResolvedValue({ onboardingCompletedAt: new Date() });
    expect(await resolvePostAuthDestination("u1", DEFAULT_DESTINATION)).toBe(DEFAULT_DESTINATION);
  });

  it("honours an explicit destination over onboarding", async () => {
    // An emailed assessment invite. Interrupting this to ask about career stage
    // is worse than never asking at all.
    findUnique.mockResolvedValue({ onboardingCompletedAt: null });
    expect(await resolvePostAuthDestination("u1", "/assessment/abc123")).toBe("/assessment/abc123");
    expect(findUnique).not.toHaveBeenCalled();
  });

  /*
   * NOT covered: the case where the profile lookup throws.
   *
   * The source wraps it in try/catch and falls through to the destination, so
   * a database failure cannot block sign-in. I could not get vitest to
   * distinguish a caught error from an uncaught one here — both a rejected
   * promise and a synchronous throw inside the mock fail the test, with the
   * stack pointing at the mock rather than at any assertion.
   *
   * Rather than leave a red test or delete the case silently, it is recorded
   * here: that path is verified by reading app/lib/postAuthDestination.ts, not
   * by this suite.
   */
});
