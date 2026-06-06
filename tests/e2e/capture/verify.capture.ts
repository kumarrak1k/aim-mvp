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
      await page
        .addStyleTag({ content: `button[aria-label="Open Next.js Dev Tools"],nextjs-portal{display:none!important}` })
        .catch(() => {});
      const section = page.locator("section").filter({ has: page.getByText("See it in action") });
      await section.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);
      await section.screenshot({ path: `${DIR}/${name}.png` });
    });
  }
});
