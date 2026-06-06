/**
 * Marketing CLIPS — paced screen recordings of each flow as silent source
 * footage for the demo video edit (see marketing/SCRIPT.md). Playwright records
 * each context to a video.webm under test-results; a post-run copy moves them to
 * the marketing/clips folder.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts clips
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { answerFor } from "../pack/fixtures/answerBank";

const VIDEO = { mode: "on" as const, size: { width: 1440, height: 900 } };

async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page
    .addStyleTag({
      content: `button[aria-label="Open Next.js Dev Tools"],nextjs-portal,[data-nextjs-toast]{display:none!important}`,
    })
    .catch(() => {});
  await page.waitForTimeout(400);
}
const beat = (page: Page, ms = 1200) => page.waitForTimeout(ms);

// Video must be set top-level (per-describe forces a new worker — Playwright errors).
test.use({ video: VIDEO });

test.describe("clips — candidate", () => {
  test.use({ storageState: statePath("professional") });

  test("candidate-flow", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/practice");
    await clean(page);
    await beat(page);
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Product Manager at a fintech scale-up");
    await beat(page);
    await page.getByRole("button", { name: "Typed answers only" }).click();
    await beat(page);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const ta = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await ta.waitFor({ state: "visible", timeout: 30_000 });
    await beat(page);
    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    await ta.pressSequentially(answerFor(q), { delay: 6 }); // visible typing
    await beat(page);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await page.getByText("AI feedback is ready").waitFor({ timeout: 30_000 }).catch(() => {});
    await beat(page, 2500);
    await page.mouse.wheel(0, 520);
    await beat(page, 2500);
  });
});

test.describe("clips — corporate", () => {
  test.use({ storageState: statePath("corpadmin") });

  test("corporate-dashboard", async ({ page }) => {
    await page.goto("/company/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await beat(page, 1500);
    await page.mouse.wheel(0, 520);
    await beat(page, 2000);
    await page.mouse.wheel(0, 520);
    await beat(page, 2000);
  });
});

test.describe("clips — assessment centre", () => {
  test.use({ storageState: statePath("professional") });

  test("ac-landing", async ({ page }) => {
    await page.goto("/practice");
    await clean(page);
    await page.getByRole("link", { name: /Assessment Centre/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await beat(page, 1500);
    await page.mouse.wheel(0, 520);
    await beat(page, 2500);
  });
});
