/**
 * Corporate admin — proves the corporate login works AND the company dashboard
 * renders the seeded company (Company + admin CompanyMember in the test DB).
 * The deeper invite/assign/results flows build on this in a later phase.
 */
import { test, expect } from "@playwright/test";
import { CORPORATE_ADMIN } from "../fixtures/personas";
import { statePath } from "../fixtures/env";

test.describe("corporate admin", () => {
  test.use({ storageState: statePath(CORPORATE_ADMIN.key) });

  test("sees the company dashboard for the seeded company", async ({ page }) => {
    await page.goto("/company/dashboard");
    await expect(page.getByText("AIM Test Co").first()).toBeVisible({ timeout: 20_000 });
  });

  test("invites a recruiter (Team seat check allows it)", async ({ page }) => {
    const email = "newrecruiter+aimtest@aimtest.dev";
    const res = await page.request.post("/api/company/members", { data: { email, role: "recruiter" } });
    expect(res.status(), await res.text()).toBe(201);

    const list = await (await page.request.get("/api/company/members")).json();
    expect(list.invites.some((i: { email: string }) => i.email === email)).toBeTruthy();
  });

  test("assigns an assessment and sees it in the assignment list", async ({ page }) => {
    const templates = await (await page.request.get("/api/company/templates")).json();
    const templateId = templates.templates[0].id;
    const candidateEmail = "assigned-candidate+aimtest@aimtest.dev";

    const res = await page.request.post("/api/company/assignments", {
      data: { candidateEmail, templateId, expiryDays: 30 },
    });
    expect(res.status(), await res.text()).toBe(201);

    const list = await (await page.request.get("/api/company/assignments")).json();
    expect(list.assignments.some((a: { candidateEmail: string }) => a.candidateEmail === candidateEmail)).toBeTruthy();
  });
});
