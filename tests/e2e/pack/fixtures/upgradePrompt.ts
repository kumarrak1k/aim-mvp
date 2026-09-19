import type { Page } from "@playwright/test";
import { UPGRADE_PROMPTED_KEY } from "../../../../app/lib/upgradePrompt";

/**
 * Mark this visit as already asked to upgrade.
 *
 * A lapsed trial (the "free" persona) is sent to /upgrade on the first page of
 * each visit. Specs that use that persona to test something else - plan gates,
 * the API walls - must not race that redirect, so they call this before their
 * first navigation. trial-ended.spec tests the redirect itself and does not.
 */
export async function skipUpgradePrompt(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // No storage: the app then treats the visit as already asked anyway.
    }
  }, UPGRADE_PROMPTED_KEY);
}
