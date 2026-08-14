/** Render-check the embedded showcases (signed-out visitor view). */
import { test } from "@playwright/test";
import { HIDE_CHROME } from "./hideChrome";

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
        .addStyleTag({ content: HIDE_CHROME })
        .catch(() => {});
      const section = page.locator("section").filter({ has: page.getByText("See it in action") });
      await section.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);
      await section.screenshot({ path: `${DIR}/${name}.png` });
    });
  }

  test("renders for-business workflow video", async ({ page }) => {
    await page.goto("/for-business");
    await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
    await page
      .addStyleTag({ content: HIDE_CHROME })
      .catch(() => {});
    const section = page.locator("section").filter({ has: page.getByText("See it work") });
    await section.scrollIntoViewIfNeeded({ timeout: 10_000 });
    await page.locator("video").first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await section.screenshot({ path: `${DIR}/for-business-video.png` });
  });

  test("renders candidate pricing comparison", async ({ page }) => {
    await page.goto("/for-candidates/pricing");
    await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
    await page
      .addStyleTag({ content: HIDE_CHROME })
      .catch(() => {});
    const section = page.locator("div").filter({ has: page.getByRole("heading", { name: "Compare plans" }) }).last();
    await section.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await section.screenshot({ path: `${DIR}/pricing-compare.png` }).catch(() => {});
  });

  for (const [path, label] of [["/", "header-home"], ["/for-candidates", "header-candidates"]] as const) {
    test(`header ${label}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
      await page
        .addStyleTag({ content: HIDE_CHROME })
        .catch(() => {});
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${DIR}/${label}.png`, clip: { x: 0, y: 0, width: 1440, height: 340 } });
    });
  }
});
