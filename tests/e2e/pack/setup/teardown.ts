/**
 * Deletes every seeded persona from the test Clerk instance after the run, so
 * reruns start clean. Wired as the `cleanup` project (the setup project's
 * teardown) in playwright.tests.config.ts.
 */
import { test as teardown } from "@playwright/test";
import { CANDIDATE_PERSONAS } from "../fixtures/personas";
import { deletePersona } from "../fixtures/seedClerkUser";

teardown("delete seeded personas", async () => {
  for (const persona of CANDIDATE_PERSONAS) {
    await deletePersona(persona);
  }
});
