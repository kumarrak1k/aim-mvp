/**
 * Marketing capture — LIGHT THEME set for the university outreach one-pagers.
 * NOT a test: drives the real app (mock AI, seeded personas) with the light
 * theme forced, and saves retina screenshots to marketing/screenshots-light/.
 * The fake camera plays tests/e2e/capture/fake-face.y4m (synthetic face) so the
 * voice+camera shot shows a person in the camera box.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture-light.config.ts
 */
import { readFileSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { answerFor } from "../pack/fixtures/answerBank";
import { runTypedInterview } from "../pack/fixtures/candidateBot";
import { stubBrowserSpeech } from "../pack/fixtures/voiceStub";
import { HIDE_CHROME } from "./hideChrome";

const DIR = "marketing/screenshots-light";

/** The anti-flash head script reads theme-mode before first paint, so seeding
 *  storage from an init script is enough to render every page light. */
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

const ROLE = "Product Manager at a fintech scale-up";

test.describe("light capture — interview practice", () => {
  test.use({ storageState: statePath("professional") });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("ip setup, question, feedback", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-01-setup.png` });

    await page.getByRole("button", { name: "Typed answers only" }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-02-question.png` });

    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    await textarea.fill(answerFor(q));
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await page.getByText("AI feedback is ready").waitFor({ timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-03-feedback.png` });

    // Open the full feedback view and frame the STAR model answer section.
    // The live FeedbackWorkspace labels it "Stronger answer example (STAR)"
    // in a <p>, not a heading (PracticeFeedbackPanel's copy is dead code).
    await page.getByRole("button", { name: /View feedback/i }).click();
    const modelHeading = page.getByText("Stronger answer example (STAR)");
    await modelHeading.waitFor({ state: "visible", timeout: 15_000 });
    await modelHeading.evaluate((el) => el.parentElement?.scrollIntoView({ block: "center" }));
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-06-model-answer.png` });
  });

  test("ip summary", async ({ page }) => {
    await runTypedInterview(page, { role: ROLE, totalQuestions: 5 });
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-04-summary.png` });
  });
});

test.describe("light capture — voice + camera", () => {
  test.use({ storageState: statePath("professional"), permissions: ["microphone", "camera"] });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("ip camera question", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(ROLE);
    await clean(page);
    await page.getByRole("button", { name: "Voice + camera interview" }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    // Do NOT wait for the live stream: the camera loop hangs this page's
    // renderer within ~10s under the synthetic device at 3x, so the shot must
    // land fast. The stock face is overlaid on the preview box (inside its
    // rounded, overflow-hidden container) and the status badge set to the
    // real "Ready" label — in a still screenshot this is indistinguishable
    // from a live camera frame.
    await page.waitForTimeout(2000);
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
    await page.waitForTimeout(700);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ip-05-camera.png` });
  });
});

test.describe("light capture — assessment centre", () => {
  test.use({ storageState: statePath("professional") });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("ac landing + all three stages + report", async ({ page }) => {
    await page.goto("/assessment-centre");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-01-landing.png` });

    // Start a self-serve AC session via the same API the setup page calls,
    // then walk each stage page for its screenshot, advancing between stages
    // with the same submissions the e2e pack proved out (mock AI, no spend).
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
    // A partly-written response makes the editor read as in-use, not empty.
    await page
      .locator("textarea")
      .last()
      .fill(
        "Recommendation: prioritise the e-commerce build-out. The exhibits show online growing 18% YoY at a higher NPS (41 vs 24) while stores decline 6%."
      )
      .catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${DIR}/ac-02-case-study.png` });

    const caseRes = await page.request.post(`/api/assessment-centre/${id}/submit-case-study`, {
      data: {
        response:
          "Recommendation: prioritise the e-commerce build-out. The exhibits show online growing 18% YoY at a higher NPS (41 vs 24) while stores decline 6%; reallocating capital to fulfilment and customer experience should recover EBITDA within two years. Key risk: cannibalising store footfall — mitigate with a click-and-collect bridge that drives store visits.",
        timeMs: 60_000,
      },
    });
    if (!caseRes.ok()) throw new Error(`submit-case-study failed: ${caseRes.status()} ${await caseRes.text()}`);

    await page.goto(`/assessment-centre/${id}/stage-2`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-03-interview.png` });

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
    if (!intRes.ok()) throw new Error(`submit-interview failed: ${intRes.status()} ${await intRes.text()}`);

    await page.goto(`/assessment-centre/${id}/stage-3`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-04-presentation.png` });

    const presRes = await page.request.post(`/api/assessment-centre/${id}/submit-presentation`, {
      data: {
        transcript:
          "My recommendation is to launch the own-brand line in two priority categories first. The data shows higher margin and growing demand; the main risk is incumbent retaliation, which we mitigate with an introductory price and a clear differentiator. In summary, a phased launch captures the upside while limiting the downside.",
      },
    });
    if (!presRes.ok()) throw new Error(`submit-presentation failed: ${presRes.status()} ${await presRes.text()}`);

    await page.goto(`/assessment-centre/${id}/report`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${DIR}/ac-05-report.png` });
  });
});

test.describe("light capture — cv studio", () => {
  test.use({ storageState: statePath("professional") });
  test.beforeEach(async ({ page }) => forceLight(page));

  test("cv studio landing + enhancer analysis", async ({ page }) => {
    await page.goto("/career-docs");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/cv-01-studio.png` });

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
    await page.screenshot({ path: `${DIR}/cv-02-enhancer-input.png` });

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/career-docs/cv-enhancer"), { timeout: 60_000 }).catch(() => null),
      page.getByRole("button", { name: /Analyse my CV/ }).click(),
    ]);
    await page.waitForTimeout(2000);
    // Results can auto-scroll the page; shoot from the top so the sticky
    // header is not detached over mid-page content.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await clean(page);
    await page.screenshot({ path: `${DIR}/cv-03-enhancer-results.png` });
    await page.screenshot({ path: `${DIR}/cv-03-enhancer-results-full.png`, fullPage: true });
  });
});
