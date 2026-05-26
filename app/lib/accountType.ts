/**
 * Account-type identity model.
 *
 * Every Clerk user is exactly one of: "candidate" or "corporate".
 * - Candidates use /for-candidates/* and /dashboard/* (interview practice).
 * - Corporates use /for-business/* and /workspace/* (assessment platform).
 *
 * Stored in Clerk privateMetadata.accountType. Set explicitly on sign-up
 * via a hidden field on the dedicated sign-up pages. For users who existed
 * before this split (no accountType yet) we lazily migrate on first read:
 *   - has a CompanyMember row → "corporate"
 *   - otherwise              → "candidate"
 *
 * Hard rule: a user cannot change their accountType from the UI. If they
 * want both roles, they sign up with a different email — same as Linear,
 * Stripe, etc.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export type AccountType = "candidate" | "corporate";

const VALID_TYPES: ReadonlyArray<AccountType> = ["candidate", "corporate"];

/**
 * Read the account type for a Clerk user, lazily migrating any pre-split
 * user who doesn't have one set. Always returns a definite type.
 */
export async function getAccountType(userId: string): Promise<AccountType> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.privateMetadata as { accountType?: string; role?: string };

  // Superadmin accounts must never be stamped as candidate/corporate.
  if (meta.role === "superadmin") {
    throw new Error("superadmin accounts do not have a candidate/corporate account type");
  }

  if (meta.accountType === "candidate" || meta.accountType === "corporate") {
    return meta.accountType;
  }

  // Lazy migration for pre-split accounts.
  const member = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  const inferred: AccountType = member ? "corporate" : "candidate";

  await client.users.updateUserMetadata(userId, {
    privateMetadata: { accountType: inferred },
  });

  return inferred;
}

/**
 * Force-set the account type for a Clerk user. Used immediately after
 * sign-up — the dedicated sign-up pages call this with the audience baked
 * into the URL (so coming via /for-candidates/sign-up = "candidate").
 *
 * Refuses to overwrite an existing type — the only way to change it is
 * for support to do it manually in Clerk.
 */
export async function setAccountTypeIfUnset(
  userId: string,
  accountType: AccountType
): Promise<{ accountType: AccountType; alreadySet: boolean; isSuperAdmin?: boolean }> {
  if (!VALID_TYPES.includes(accountType)) {
    throw new Error(`Invalid accountType: ${accountType}`);
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.privateMetadata as { accountType?: string; role?: string };

  // Superadmin accounts are isolated — they cannot be used as candidate/corporate.
  if (meta.role === "superadmin") {
    return { accountType: "candidate", alreadySet: false, isSuperAdmin: true };
  }

  const existing = meta.accountType;

  if (existing === "candidate" || existing === "corporate") {
    return { accountType: existing, alreadySet: true };
  }

  await client.users.updateUserMetadata(userId, {
    privateMetadata: { accountType },
  });

  return { accountType, alreadySet: false };
}

/**
 * URL helpers — the canonical destinations for each audience.
 * Centralising these means renaming /practice → /dashboard later
 * (Session 2) only touches one file.
 */
export const AUDIENCE_PATHS: Record<AccountType, {
  marketingHome: string;
  signIn: string;
  signUp: string;
  authedHome: string;
}> = {
  candidate: {
    marketingHome: "/for-candidates",
    signIn: "/for-candidates/sign-in",
    signUp: "/for-candidates/sign-up",
    authedHome: "/practice", // Renamed to /dashboard in Session 2
  },
  corporate: {
    marketingHome: "/for-business",
    signIn: "/for-business/sign-in",
    signUp: "/for-business/sign-up",
    authedHome: "/company/dashboard", // Renamed to /workspace/dashboard in Session 2
  },
};
