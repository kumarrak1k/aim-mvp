/**
 * Marketing capture — END-TO-END JOURNEY LIBRARY (light theme, retina).
 * Four numbered story folders under marketing/journeys/, built for posters,
 * flyers, emails and product demos:
 *   01-interview-practice: sign-up → setup (video mode) → question with live
 *     camera (stock face) → answering → AI feedback → STAR model answer → summary
 *   02-progress: dashboard → readiness trend → session report → STAR panel
 *   03-assessment-centre: landing → stage picker → case study → interview with
 *     camera → presentation → report
 *   04-cv-studio: hub → enhancer input → analysis → detail
 * Same harness as light.capture.ts (mock AI, seeded personas, forced light).
 */
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { answerFor } from "../pack/fixtures/answerBank";
import { runTypedInterview } from "../pack/fixtures/candidateBot";
import { stubBrowserSpeech } from "../pack/fixtures/voiceStub";
import { HIDE_CHROME } from "./hideChrome";

const ROOT = "marketing/journeys";
const J1 = `${ROOT}/01-interview-practice`;
const J2 = `${ROOT}/02-progress`;
const J3 = `${ROOT}/03-assessment-centre`;
const J4 = `${ROOT}/04-cv-studio`;
for (const d of [J1, J2, J3, J4]) mkdirSync(d, { recursive: true });

const ROLE = "Product Manager at a fintech scale-up";

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
  await page.waitForTimeout(500);
}

/** Select the voice+camera mode card and PROVE it took: the setup page can
 *  reset the mode to the saved default when its usage/profile fetch resolves,
 *  so a bare click sometimes loses the race and the session starts typed. */
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
  await expect(card).toHaveAttribute("aria-pressed", "true");
}

/** Overlay the stock face on the live camera preview and set the badge to the
 *  real "Ready" label — identical to a live frame in a still screenshot. */
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

test.describe("journey 01 — sign-up", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("sign-up page", async ({ page }) => {
    await page.goto("/sign-up");
    await page.waitForTimeout(3500);
    await clean(page);
    await page.screenshot({ path: `${J1}/01-sign-up.png` });
  });
});

test.describe("journey 01 — interview practice (video mode)", () => {
  test.use({ storageState: statePath("professional"), permissions: ["microphone", "camera"] });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("setup in video mode", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await clean(page);
    await selectCameraMode(page);
    await page.getByText("Choose one interview format.").scrollIntoViewIfNeeded().catch(() => {});
    await page.mouse.wheel(0, -160);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${J1}/02-setup-video-mode.png` });
  });

  test("question + answering with live camera", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await clean(page);
    await selectCameraMode(page);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    // The synthetic camera hangs this renderer ~10s after the stream starts,
    // so both shots land in one fast sequence: face on, shoot, fill, shoot.
    await page.waitForTimeout(1500);
    await overlayFace(page);
    await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${J1}/03-question-camera.png` });
    const q = await page.getByTestId("question-text").innerText({ timeout: 3_000 }).catch(() => "");
    await textarea.fill(answerFor(q));
    await page.screenshot({ path: `${J1}/04-answer-in-progress.png` });
  });

  test("feedback + model answer", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await clean(page);
    await page.getByRole("button", { name: "Typed answers only" }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    await textarea.fill(answerFor(q));
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await page.getByText("AI feedback is ready").waitFor({ timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await clean(page);
    await page.screenshot({ path: `${J1}/05-ai-feedback.png` });

    await page.getByRole("button", { name: /View feedback/i }).click();
    const modelHeading = page.getByText("Stronger answer example (STAR)");
    await modelHeading.waitFor({ state: "visible", timeout: 15_000 });
    await modelHeading.evaluate((el) => el.parentElement?.scrollIntoView({ block: "center" }));
    await clean(page);
    await page.screenshot({ path: `${J1}/06-model-answer.png` });
  });

  test("session summary", async ({ page }) => {
    await runTypedInterview(page, { role: ROLE, totalQuestions: 5 });
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${J1}/07-session-summary.png` });
  });
});

test.describe("journey 02 — progress", () => {
  test.use({ storageState: statePath("professional") });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("progress overview, trend, session report, star panel", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page.screenshot({ path: `${J2}/01-progress-overview.png` });

    const trend = page.getByText(/Readiness trend/i).first();
    await trend.evaluate((el) => el.scrollIntoView({ block: "start" })).catch(() => {});
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${J2}/02-readiness-trend.png` });

    const latestLink = page.locator('a[href^="/progress/"]:not([href$="/print"])').first();
    await latestLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page.screenshot({ path: `${J2}/03-session-report.png` });

    // Each per-question review is a collapsed <details>; the STAR model answer
    // lives inside, so expand the first question before framing it.
    const qCard = page.locator("summary", { hasText: /Question 1/ }).first();
    await qCard.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await qCard.click({ timeout: 10_000 });
    const star = page.getByText(/Model answer \(STAR\)/i).first();
    await star.waitFor({ state: "visible", timeout: 10_000 });
    await star.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${J2}/04-star-model-answer.png` });
  });
});

test.describe("journey 03 — assessment centre", () => {
  test.use({ storageState: statePath("professional"), permissions: ["microphone", "camera"] });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("landing, stage picker, all stages, report", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/assessment-centre");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${J3}/01-landing.png` });

    const picker = page.getByText(/Stages to include/i).first();
    const hasPicker = await picker.isVisible().catch(() => false);
    if (hasPicker) {
      await picker.scrollIntoViewIfNeeded().catch(() => {});
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${J3}/02-stage-picker.png` });
    }

    const startRes = await page.request.post("/api/assessment-centre/start", {
      data: {
        role: "Graduate Software Engineer",
        sector: "Technology",
        experienceLevel: "Graduate / entry level",
        selectedStages: ["stage1", "stage2", "stage3"],
      },
    });
    if (!startRes.ok()) throw new Error(`start-ac failed: ${startRes.status()} ${await startRes.text()}`);
    const { id } = await startRes.json();

    await page.goto(`/assessment-centre/${id}/stage-1`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page
      .locator("textarea")
      .last()
      .fill(
        "Recommendation: prioritise the e-commerce build-out. The exhibits show online growing 18% YoY at a higher NPS (41 vs 24) while stores decline 6%."
      )
      .catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${J3}/03-case-study.png` });

    const caseRes = await page.request.post(`/api/assessment-centre/${id}/submit-case-study`, {
      data: {
        response:
          "Recommendation: prioritise the e-commerce build-out. The exhibits show online growing 18% YoY at a higher NPS (41 vs 24) while stores decline 6%; reallocating capital to fulfilment and customer experience should recover EBITDA within two years.",
        timeMs: 60_000,
      },
    });
    if (!caseRes.ok()) throw new Error(`submit-case-study failed: ${caseRes.status()}`);

    // The stage-2 page is the interview STAGE INTRO (mode chooser + what to
    // expect) — there is no live camera on it; the in-session camera moment
    // is journey 01's shot 03.
    await page.goto(`/assessment-centre/${id}/stage-2`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${J3}/04-interview-stage.png` });

    const intRes = await page.request.post(`/api/assessment-centre/${id}/submit-interview`, {
      data: {
        results: [
          {
            question: "Tell me about a time you led a team.",
            answer: "I led a cross-functional team to ship a release two weeks early by re-sequencing the plan.",
          },
        ],
        summary: { overall_score: 8 },
      },
    });
    if (!intRes.ok()) throw new Error(`submit-interview failed: ${intRes.status()}`);

    await page.goto(`/assessment-centre/${id}/stage-3`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page.screenshot({ path: `${J3}/05-presentation.png` });

    const presRes = await page.request.post(`/api/assessment-centre/${id}/submit-presentation`, {
      data: {
        transcript:
          "My recommendation is to launch the own-brand line in two priority categories first. The data shows higher margin and growing demand; a phased launch captures the upside while limiting the downside.",
      },
    });
    if (!presRes.ok()) throw new Error(`submit-presentation failed: ${presRes.status()}`);

    await page.goto(`/assessment-centre/${id}/report`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${J3}/06-report.png` });
  });
});

test.describe("journey 04 — cv studio", () => {
  test.use({ storageState: statePath("professional") });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("hub, enhancer input, analysis, detail", async ({ page }) => {
    await page.goto("/career-docs");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${J4}/01-cv-studio.png` });

    await page.goto("/career-docs/cv-enhancer");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.getByPlaceholder("e.g. Senior Product Manager").fill("Graduate Data Analyst");
    await page.getByPlaceholder("Type your sector, or pick one below").fill("Technology").catch(() => {});
    await page.getByPlaceholder(/Paste your full CV here/).fill(
      [
        "PROFILE",
        "Final-year BSc Mathematics student targeting graduate data roles. Comfortable with Python, SQL and clear communication of findings.",
        "",
        "EXPERIENCE",
        "Data Intern, Retail Insights Ltd (Jun 2025 - Sep 2025)",
        "- Built weekly sales dashboards in Python and Excel used by 3 category managers",
        "- Automated a manual reporting step, saving the team around 4 hours a week",
        "",
        "Campus Brand Ambassador, TechSoc (2024 - 2025)",
        "- Grew society newsletter from 200 to 650 subscribers over two terms",
        "",
        "EDUCATION",
        "BSc Mathematics, 2:1 expected, 2026",
        "A-levels: Maths (A*), Further Maths (A), Economics (A)",
        "",
        "SKILLS",
        "Python (pandas), SQL, Excel, Tableau, presenting to non-technical audiences",
      ].join("\n")
    );
    await clean(page);
    await page.screenshot({ path: `${J4}/02-enhancer-input.png` });

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/career-docs/cv-enhancer"), { timeout: 60_000 }).catch(() => null),
      page.getByRole("button", { name: /Analyse my CV/ }).click(),
    ]);
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await clean(page);
    await page.screenshot({ path: `${J4}/03-enhancer-analysis.png` });

    const detail = page.getByText(/Section breakdown/i).first();
    await detail.evaluate((el) => el.scrollIntoView({ block: "start" })).catch(() => {});
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${J4}/04-enhancer-detail.png` });
  });
});
