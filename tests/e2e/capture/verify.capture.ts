/** Render-check the embedded showcases (signed-out visitor view). */
import { test } from "@playwright/test";

const DIR = "marketing/verify";

test.describe("verify embeds", () => {
  for (const [path, name] of [
    ["/for-candidates", "for-candidates"],
    ["/for-business", "for-business"],
  ] as const) {
    test(`renders ${name}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
      const heading = page.getByText("See it in action").first();
      await heading.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${DIR}/${name}.png` });
    });
  }
});
