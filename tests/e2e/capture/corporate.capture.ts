/**
 * Marketing capture — corporate recruiter WORKFLOW. Drives the real app as a
 * corporate admin through the process: dashboard → build a role template →
 * invite candidates → review results → open one candidate's full report.
 * Saves retina screenshots to marketing/screenshots/.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts corporate
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { HIDE_CHROME } from "./hideChrome";

const DIR = "marketing/screenshots";

async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page
    .addStyleTag({ content: HIDE_CHROME })
    .catch(() => {});
  await page.waitForTimeout(500);
}

test.describe("corporate workflow", () => {
  test.use({ storageState: statePath("corpadmin") });

  test("dashboard overview", async ({ page }) => {
    await page.goto("/company/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-01-dashboard.png` });
    await page.screenshot({ path: `${DIR}/corporate-01-dashboard-full.png`, fullPage: true });
  });

  test("step 1 — build a role template", async ({ page }) => {
    await page.goto("/company/templates/new");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByPlaceholder("e.g. Senior Software Engineer AC").fill("Graduate Software Engineer — Assessment Centre").catch(() => {});
    await page.getByPlaceholder("e.g. Software Engineer").fill("Graduate Software Engineer").catch(() => {});
    await page.getByRole("button", { name: /Assessment centre/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-template.png` });
  });

  test("step 2 — invite candidates", async ({ page }) => {
    await page.goto("/company/candidates");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByPlaceholder("candidate@example.com").fill("new.candidate@example.com").catch(() => {});
    // Choose the first real template in the dropdown.
    await page.locator("select").first().selectOption({ index: 1 }).catch(() => {});
    await page.waitForTimeout(400);
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-invite.png` });
  });

  test("step 3 — review results", async ({ page }) => {
    await page.goto("/company/results");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByText("priya.shah@example.com").first().waitFor({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(500);
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-results.png` });
  });

  test("step 4 — candidate full report", async ({ page }) => {
    await page.goto("/company/results");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByText("priya.shah@example.com").first().waitFor({ timeout: 15_000 }).catch(() => {});
    const review = page.getByRole("link", { name: /Review/i }).first();
    if (await review.count()) await review.click().catch(() => {});
    else await page.getByText("priya.shah@example.com").first().click().catch(() => {});
    await page.waitForURL(/\/company\/results\/.+/, { timeout: 15_000 }).catch(() => {});
    await page.getByText(/Overall|Recommendation|Per-question|Back to all results/i).first().waitFor({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-detail.png` });
    // Scroll to the per-question / delivery detail for a second shot.
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    await clean(page);
    await page.screenshot({ path: `${DIR}/corporate-detail-questions.png` });
  });
});

test.describe("assessment centre (candidate-facing)", () => {
  test.use({ storageState: statePath("professional") });

  test("assessment centre landing", async ({ page }) => {
    await page.goto("/practice");
    await clean(page);
    await page.getByRole("link", { name: /Assessment Centre/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-01-landing.png` });
  });
});
