/**
 * Deletes every seeded persona from the test Clerk instance after the run, so
 * reruns start clean. Wired as the `cleanup` project (the setup project's
 * teardown) in playwright.tests.config.ts.
 */
import { test as teardown } from "@playwright/test";
import { CANDIDATE_PERSONAS, CORPORATE_ADMIN, DISPOSABLE_CANDIDATE } from "../fixtures/personas";
import { deletePersona } from "../fixtures/seedClerkUser";
import { deleteCompany } from "../fixtures/seedCompany";

teardown("delete seeded personas", async () => {
  for (const persona of CANDIDATE_PERSONAS) {
    await deletePersona(persona);
  }
  await deleteCompany();
  await deletePersona(CORPORATE_ADMIN);
  // The account-deletion spec usually deletes this one itself; tolerate that.
  await deletePersona(DISPOSABLE_CANDIDATE);
});
