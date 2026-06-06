/**
 * Marketing capture — corporate + assessment-centre. Drives the real app as a
 * corporate admin (dashboard) and as a candidate reaching the assessment-centre,
 * saving retina screenshots to marketing/screenshots/.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts corporate
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";

const DIR = "marketing/screenshots";

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
  await page.waitForTimeout(500);
}

test.describe("marketing capture — corporate", () => {
  test.use({ storageState: statePath("corpadmin") });

  test("company dashboard", async ({ page }) => {
    await page.goto("/company/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-01-dashboard.png` });
    await page.screenshot({ path: `${DIR}/corporate-01-dashboard-full.png`, fullPage: true });
  });
});

test.describe("marketing capture — assessment centre", () => {
  test.use({ storageState: statePath("professional") });

  test("assessment centre landing", async ({ page }) => {
    await page.goto("/practice");
    await clean(page);
    // Follow the top-nav Assessment Centre link wherever it lands.
    await page.getByRole("link", { name: /Assessment Centre/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-01-landing.png` });
    await page.screenshot({ path: `${DIR}/ac-01-landing-full.png`, fullPage: true });
  });
});
