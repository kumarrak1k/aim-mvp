/**
 * Career-doc generators (Professional-only): CV enhancer, personal statement,
 * cover letter. All three route through callOpenAIChat, so they're deterministic
 * under AIM_TEST_MODE=mock. The CV enhancer is also @real-ai — its large JSON
 * schema is the best canary for live-model parser drift on the nightly.
 *
 * Gating: checkCareerDocAccess requires plan.isProfessional, so the Professional
 * persona passes and the Plus persona is rejected (403).
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { FREE_TIER } from "../../../../app/lib/candidatePlan";

test.describe("career docs", () => {
  test.describe("professional persona", () => {
    test.use({ storageState: statePath("professional") });

    // Clerk session tokens live for 60 seconds. These tests call the API via
    // page.request without rendering a page, so minutes into the pack the
    // stored token is stale and every call 401s. Navigating first lets
    // Clerk's client refresh the token (same fix as zz-account.spec).
    test.beforeEach(async ({ page }) => {
      await page.goto("/career-docs");
    });

    test("personal statement generator returns a statement", async ({ page }) => {
      const res = await page.request.post("/api/career-docs/personal-statement", {
        data: {
          statementType: "graduate-scheme",
          targetProgramOrRole: "Graduate Software Engineering Scheme",
          whyThis: "I am drawn to this scheme because it pairs rigorous engineering with real commercial impact and structured mentorship.",
          background: "I completed a BSc in Computer Science and interned at two startups building web platforms end to end.",
          achievements: "Led a project that shipped a tool adopted by 300 students, and won a national hackathon.",
          wordLimit: 500,
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const { result } = await res.json();
      expect(typeof result.statement).toBe("string");
      expect(Array.isArray(result.strengths)).toBe(true);
    });

    test("cover letter generator returns a letter", async ({ page }) => {
      const res = await page.request.post("/api/career-docs/cover-letter", {
        data: {
          companyName: "Northwind Retail",
          jobTitle: "Data Analyst",
          jobDescription: "We are looking for a data analyst to build dashboards, analyse sales trends, and support commercial decisions across the business.",
          experience: "Two years analysing retail data in SQL and Python, building dashboards that informed pricing and inventory decisions.",
          tone: "professional",
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const { result } = await res.json();
      expect(typeof result.letter).toBe("string");
      expect(Array.isArray(result.keyThemes)).toBe(true);
    });

    test("CV enhancer returns an analysis", { tag: "@real-ai" }, async ({ page }) => {
      const res = await page.request.post("/api/career-docs/cv-enhancer", {
        data: {
          targetRole: "Product Manager",
          industry: "SaaS",
          cvText: "Experienced product manager with five years building B2B SaaS products, leading cross-functional teams and shipping features that grew retention.",
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const { result } = await res.json();
      expect(typeof result.overallScore).toBe("number");
      expect(Array.isArray(result.enhancedBullets)).toBe(true);
    });
  });

  test.describe("plus persona (no Professional access)", () => {
    test.use({ storageState: statePath("plus") });

    // Same 60-second-token refresh as above.
    test.beforeEach(async ({ page }) => {
      await page.goto("/career-docs");
    });

    // A non-Professional account gets FREE_TIER.careerDocs generations so it can
    // see what the Studio produces, then the upgrade gate returns. Run enough
    // times to exhaust the taster and assert the wall is still there at the end.
    test("career docs give a taster, then require Professional", async ({ page }) => {
      const call = () =>
        page.request.post("/api/career-docs/cv-enhancer", {
          data: {
            targetRole: "Product Manager",
            cvText:
              "Experienced product manager with five years building B2B SaaS products and leading cross-functional teams.",
          },
        });

      const statuses: number[] = [];
      for (let i = 0; i < FREE_TIER.careerDocs + 1; i++) {
        statuses.push((await call()).status());
      }

      // Everything before the last call is inside the allowance; the last is not.
      expect(statuses.slice(0, FREE_TIER.careerDocs).every((s) => s === 200)).toBe(true);
      expect(statuses.at(-1)).toBe(403);
    });
  });
});
