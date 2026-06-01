/**
 * Persona seeding via the Clerk Backend SDK.
 *
 * Uses a DEDICATED test Clerk instance (CLERK_SECRET_KEY = sk_test_… of a
 * non-production app). Idempotent: deletes any pre-existing user with the
 * persona email first, so every run starts from a clean slate.
 */
import { createClerkClient } from "@clerk/backend";
import { TEST_PASSWORD } from "./env";
import type { Persona } from "./personas";

const secretKey = process.env.CLERK_SECRET_KEY;
if (secretKey && /sk_live_/.test(secretKey)) {
  throw new Error("Refusing to seed users with a LIVE Clerk secret key. Use a test instance (sk_test_…).");
}

export const clerk = createClerkClient({ secretKey: secretKey ?? "" });

/** Delete any users with this email, then create a fresh one with the metadata. */
export async function seedPersona(persona: Persona) {
  const existing = await clerk.users.getUserList({ emailAddress: [persona.email] });
  for (const u of existing.data) {
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

  return user;
}

/** Remove all seeded persona users (run by the teardown project). */
export async function deletePersona(persona: Persona) {
  const existing = await clerk.users.getUserList({ emailAddress: [persona.email] });
  for (const u of existing.data) {
    await clerk.users.deleteUser(u.id);
  }
}
