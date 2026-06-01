/**
 * Email-preference seeding (Prisma, test DB) for the one-click unsubscribe spec.
 * No Clerk user needed — the unsubscribe endpoint is token-based and
 * unauthenticated (RFC 8058), so a bare EmailPreference row with a fixed token
 * is enough. Idempotent: delete-then-create, so re-runs start clean.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const UNSUB_TOKEN = "aimtest-unsubscribe-token";
const CLERK_USER_ID = "aimtest-emailpref-user";
const EMAIL = "emailpref+aimtest@aimtest.dev";

/** Seed a marketing-opted-IN preference with a fixed unsubscribe token. */
export async function seedEmailPreference() {
  await deleteEmailPreference();
  await prisma.emailPreference.create({
    data: { clerkUserId: CLERK_USER_ID, email: EMAIL, marketingConsent: true, unsubscribeToken: UNSUB_TOKEN },
  });
}

/** Current marketing consent for the seeded row (null if absent). */
export async function getMarketingConsent(): Promise<boolean | null> {
  const pref = await prisma.emailPreference.findUnique({ where: { clerkUserId: CLERK_USER_ID } });
  return pref ? pref.marketingConsent : null;
}

export async function deleteEmailPreference() {
  await prisma.emailPreference.deleteMany({ where: { clerkUserId: CLERK_USER_ID } });
  await prisma.emailPreference.deleteMany({ where: { unsubscribeToken: UNSUB_TOKEN } });
}
