/**
 * Marketing ADVERT WALKTHROUGH — one continuous, paced screen recording of the
 * live product for use as advert source footage (student audience: the UI in
 * motion, not stills). Light theme, mock AI, seeded "professional" persona.
 *
 * Playwright records the whole context to a single video.webm under
 * test-results/. A post-run ffmpeg step (scripts, see the task) trims it and
 * builds the vertical 9:16 cut for TikTok.
 *
 * Run:
 *   npx dotenv-cli -e .env.test -- npx playwright test \
 *     -c playwright.capture-light.config.ts --project=capture-advert
 */
import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { answerFor } from "../pack/fixtures/answerBank";
import { stubBrowserSpeech } from "../pack/fixtures/voiceStub";
import { HIDE_CHROME } from "./hideChrome";

const ROLE = "Graduate Product Manager";

// One continuous take -> one webm. Mobile 9:16: record at 1080x1920 so the
// phone-layout viewport (432x768 @ dsf3, set in the project) downscales crisply
// and full-bleed — the video IS the phone screen.
test.use({
  video: { mode: "on", size: { width: 1080, height: 1920 } },
  storageState: statePath("professional"),
  permissions: ["microphone", "camera"],
});

async function forceLight(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("theme-mode", "light");
    } catch {}
    document.documentElement.setAttribute("data-theme-mode", "light");
    document.documentElement.setAttribute("data-theme", "light");
  });
}

async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Beat: a deliberate pause so the motion reads on screen. */
const beat = (page: Page, ms = 1100) => page.waitForTimeout(ms);

/** Select the voice+camera mode card and prove it took (the setup page can
 *  reset to the saved default when its usage fetch resolves). */
async function selectCameraMode(page: Page) {
  const card = page.getByRole("button", { name: "Voice + camera interview" });
  await card.waitFor({ state: "visible", timeout: 15_000 });
  for (let i = 0; i < 4; i++) {
    await card.click();
    try {
      await expect(card).toHaveAttribute("aria-pressed", "true", { timeout: 1_500 });
      return;
    } catch {}
  }
}

/** Overlay the stock face on the live camera preview and flip the badge to
 *  "Ready" — a real-looking person in the camera box, nobody filmed. */
async function overlayFace(page: Page) {
  const faceB64 = readFileSync("tests/e2e/capture/fake-face-crop.png").toString("base64");
  await page.evaluate((b64) => {
    const v = document.querySelector("video");
    if (!v || !v.parentElement) return;
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${b64}`;
    Object.assign(img.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: "5",
    });
    v.parentElement.appendChild(img);
    const badge = [...document.querySelectorAll("span")].find((s) => s.textContent?.trim() === "Starting");
    if (badge) badge.textContent = "Ready";
  }, faceB64);
}

test.describe("advert walkthrough", () => {
  test.beforeEach(async ({ page }) => forceLight(page));

  test("continuous product demo", async ({ page }) => {
    test.setTimeout(180_000);
    await stubBrowserSpeech(page);

    // 1) Setup — tailor the interview to a role.
    await page.goto("/practice");
    await clean(page);
    await beat(page, 900);
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await beat(page, 900);
    await selectCameraMode(page);
    await beat(page, 1100);

    // 2) Start — the tailored question arrives.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(1200);

    // 3) Camera on (stock face). Stop the fake device loop right after so the
    //    synthetic camera can't hang the renderer during the feedback wait.
    await overlayFace(page);
    await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
    await beat(page, 1600);
    await page.evaluate(() => {
      document.querySelectorAll("video").forEach((v) => {
        const s = v.srcObject as MediaStream | null;
        s?.getTracks().forEach((t) => t.stop());
      });
    });

    // 4) Answer — show visible typing for the opening, then complete instantly
    //    so the take stays tight (the full answer would type for ~20s).
    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    const ans = answerFor(q);
    await textarea.click();
    await textarea.pressSequentially(ans.slice(0, 70), { delay: 24 });
    await page.waitForTimeout(500);
    await textarea.fill(ans);
    await beat(page, 900);

    // 5) AI feedback — scores land.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      // One button, labelled "Get AI feedback" at every width.
      page.getByRole("button", { name: /Get (AI )?feedback/ }).first().click(),
    ]);
    await page.getByText(/feedback is ready/i).waitFor({ timeout: 30_000 }).catch(() => {});
    await clean(page);
    await beat(page, 2200);
    await page.mouse.wheel(0, 380);
    await beat(page, 2000);

    // 6) Model answer — the stronger STAR rebuild to learn from.
    await page.getByRole("button", { name: /View feedback/i }).first().click().catch(() => {});
    const modelHeading = page.getByText("Stronger answer example (STAR)");
    await modelHeading.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    await modelHeading.evaluate((el) => el.parentElement?.scrollIntoView({ block: "center" })).catch(() => {});
    await beat(page, 2600);

    // 7) Progress — readiness improving over sessions.
    await page.goto("/progress");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await beat(page, 1600);
    const trend = page.getByText(/Readiness trend/i).first();
    await trend.evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
    await beat(page, 2600);
  });
});
