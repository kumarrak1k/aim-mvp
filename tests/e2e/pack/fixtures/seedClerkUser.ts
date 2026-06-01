/**
 * Persona seeding: Clerk user (Backend SDK) + a UserProfile row (Prisma) that
 * marks Terms-of-Use accepted.
 *
 * Uses a DEDICATED test Clerk instance (CLERK_SECRET_KEY = sk_test_…) and the
 * test DATABASE_URL (a throwaway Neon branch). Idempotent: deletes any existing
 * user + profile for the persona email first, so every run starts clean.
 *
 * Why the UserProfile row: app/lib/legal.ts `requireTosAcceptance()` redirects
 * any signed-in user to /accept-terms until their UserProfile.tosAcceptedVersion
 * matches CURRENT_TOS_VERSION. Without this, /practice bounces every persona to
 * the terms gate.
 */
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { TEST_PASSWORD } from "./env";
import type { Persona } from "./personas";

// Keep in sync with CURRENT_TOS_VERSION in app/lib/legal.ts.
const TOS_VERSION = "2026-05-13";

const secretKey = process.env.CLERK_SECRET_KEY;
if (secretKey && /sk_live_/.test(secretKey)) {
  throw new Error("Refusing to seed users with a LIVE Clerk secret key. Use a test instance (sk_test_…).");
}

export const clerk = createClerkClient({ secretKey: secretKey ?? "" });
const prisma = new PrismaClient();

/** Delete any existing user + profile for this email, then create fresh. */
export async function seedPersona(persona: Persona) {
  const existing = await clerk.users.getUserList({ emailAddress: [persona.email] });
  for (const u of existing.data) {
    await prisma.userProfile.deleteMany({ where: { clerkUserId: u.id } });
    await clerk.users.deleteUser(u.id);
  }

  const user = await clerk.users.createUser({
    emailAddress: [persona.email],
    password: TEST_PASSWORD,
    skipPasswordChecks: true,
  });

  if (persona.privateMetadata && Object.keys(persona.privateMetadata).length > 0) {
    await clerk.users.updateUserMetadata(user.id, { privateMetadata: persona.privateMetadata });
  }

  // Mark Terms of Use accepted so the app doesn't redirect to /accept-terms.
  const now = new Date();
  await prisma.userProfile.upsert({
    where: { clerkUserId: user.id },
    create: { clerkUserId: user.id, tosAcceptedAt: now, tosAcceptedVersion: TOS_VERSION },
    update: { tosAcceptedAt: now, tosAcceptedVersion: TOS_VERSION },
  });

  return user;
}

/** Remove the seeded user + profile (run by the teardown project). */
export async function deletePersona(persona: Persona) {
  const existing = await clerk.users.getUserList({ emailAddress: [persona.email] });
  for (const u of existing.data) {
    await prisma.userProfile.deleteMany({ where: { clerkUserId: u.id } });
    await clerk.users.deleteUser(u.id);
  }
}
