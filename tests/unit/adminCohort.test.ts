/**
 * Admin headline numbers must describe real candidates only.
 *
 * On 15 Sep 2026 the dashboard mixed team test accounts, complimentary
 * accounts and database rows for users no longer in Clerk into its totals,
 * which made genuine activity impossible to read. These helpers decide who
 * counts; the user table still lists everyone.
 */
import { describe, it, expect } from "vitest";
import { isTeamAccount, hasHadComplimentaryAccess, headlineUserIds } from "@/app/lib/adminCohort";

describe("isTeamAccount", () => {
  it("treats superadmins as team", () => {
    expect(isTeamAccount({ email: "someone@example.com", role: "superadmin" })).toBe(true);
  });

  it("treats team email addresses as team, whatever the case", () => {
    expect(isTeamAccount({ email: "Hello@AICareerMentor.co.uk", role: null })).toBe(true);
    expect(isTeamAccount({ email: "rak1k+test3@gmail.com", role: null })).toBe(true);
    expect(isTeamAccount({ email: "kumarrak1k@gmail.com", role: null })).toBe(true);
  });

  it("does not treat an ordinary candidate as team", () => {
    expect(isTeamAccount({ email: "student@uni.ac.uk", role: null })).toBe(false);
  });
});

describe("hasHadComplimentaryAccess", () => {
  it("is true once a comp plan has been set, even after it expires", () => {
    expect(hasHadComplimentaryAccess({ compPlan: "professional", compUntil: "2020-01-01" })).toBe(true);
  });

  it("is false when no comp plan was ever set", () => {
    expect(hasHadComplimentaryAccess({ compPlan: null, compUntil: null })).toBe(false);
  });
});

describe("headlineUserIds", () => {
  it("keeps real candidates and drops team and complimentary accounts", () => {
    const ids = headlineUserIds([
      { id: "u_real", email: "student@uni.ac.uk", role: null, compPlan: null },
      { id: "u_team", email: "rak1k+demo@gmail.com", role: null, compPlan: null },
      { id: "u_admin", email: "ops@example.com", role: "superadmin", compPlan: null },
      { id: "u_comp", email: "friend@example.com", role: null, compPlan: "plus" },
    ]);

    expect([...ids]).toEqual(["u_real"]);
  });
});
