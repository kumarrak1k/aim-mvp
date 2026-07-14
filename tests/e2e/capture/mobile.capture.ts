/**
 * Mobile/tablet audit capture — NOT a test: walks the signed-in app at phone
 * and tablet viewports, logs any horizontal overflow, and saves full-page
 * screenshots for responsive review.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts mobile
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";

const DIR = process.env.MOBILE_AUDIT_DIR ?? "marketing/screenshots/mobile-audit";

async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page
    .addStyleTag({
      content: `
        button[aria-label="Open Next.js Dev Tools"],
        nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
      `,
    })
    .catch(() => {});
  await page.waitForTimeout(400);
}

async function measure(page: Page): Promise<number> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return Math.max(
      document.documentElement.scrollWidth - vw,
      document.body ? document.body.scrollWidth - vw : 0
    );
  });
}

const PAGES: Array<[string, string]> = [
  ["practice", "/practice"],
  ["profile", "/profile"],
  ["progress", "/progress"],
  ["career-docs", "/career-docs"],
];

for (const [vp, width, height] of [
  ["phone", 375, 812],
  ["tablet", 768, 1024],
] as const) {
  test.describe(`mobile audit — ${vp}`, () => {
    test.use({
      storageState: statePath("professional"),
      viewport: { width, height },
    });

    test(`authed pages at ${vp}`, async ({ page }) => {
      for (const [name, path] of PAGES) {
        await page.goto(path, { waitUntil: "networkidle" }).catch(() => page.goto(path));
        await clean(page);
        const overflow = await measure(page);
        console.log(`AUDIT ${vp} ${name} overflow=${overflow}px`);
        await page.screenshot({ path: `${DIR}/authed-${name}--${vp}.png`, fullPage: true });
      }

      // Live practice session — the screen candidates actually use on the go.
      await page.goto("/practice");
      await clean(page);
      await page
        .getByPlaceholder(/Example:|saved profile context/i)
        .first()
        .fill("Product Manager at a fintech scale-up");
      await page.getByRole("button", { name: "Typed answers only" }).click();
      await page
        .getByTestId("question-text")
        .waitFor({ state: "visible", timeout: 45_000 })
        .catch(() => {});
      await page.waitForTimeout(800);
      const overflow = await measure(page);
      console.log(`AUDIT ${vp} session overflow=${overflow}px`);
      await page.screenshot({ path: `${DIR}/authed-session--${vp}.png`, fullPage: true });
    });
  });
}
