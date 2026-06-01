/**
 * Persona gating — proves each seeded login works AND sees the right plan
 * gating on /practice. The deep entitlement logic is locked separately by
 * tests/unit/candidatePlan.persona.test.ts; this confirms it holds in the
 * real, signed-in UI.
 */
import { test, expect } from "@playwright/test";
import { CANDIDATE_PERSONAS } from "../fixtures/personas";
import { statePath } from "../fixtures/env";

for (const persona of CANDIDATE_PERSONAS) {
  test.describe(`persona: ${persona.key} (${persona.planName})`, () => {
    test.use({ storageState: statePath(persona.key) });

    test("signed in on /practice with correct voice/camera gating", async ({ page }) => {
      await page.goto("/practice");

      // Signed-in candidates reach the start screen (the role input).
      await expect(page.getByPlaceholder(/Example:|saved profile context/i).first()).toBeVisible({
        timeout: 20_000,
      });

      // Free locks voice/camera (the mode card shows a "Pro" badge); paid/trial
      // unlock them.
      const voiceCard = page.getByRole("button", { name: /Voice interview/ });
      await expect(voiceCard).toBeVisible();
      if (persona.voiceLocked) {
        await expect(voiceCard.getByText("Pro", { exact: true })).toBeVisible();
      } else {
        await expect(voiceCard.getByText("Pro", { exact: true })).toHaveCount(0);
      }
    });
  });
}
