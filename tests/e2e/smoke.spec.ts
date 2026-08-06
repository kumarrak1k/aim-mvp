/**
 * Smoke tests for aicareermentor.co.uk
 *
 * These tests run against the live production site and verify that
 * critical pages load correctly and key UI elements are present.
 *
 * Run with:  npm run test:e2e
 * Or:        npx playwright test
 */

import { test, expect } from "@playwright/test";

// ─── Homepage ─────────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("loads and shows the main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Career Mentor|aim/i);
    // Hero CTA should be visible
    const hero = page.locator("h1, [data-testid='hero-heading']").first();
    await expect(hero).toBeVisible();
  });

  test("shows sign-in / get started button", async ({ page }) => {
    await page.goto("/");
    // Look for any prominent CTA link/button
    const cta = page.getByRole("link", { name: /get started|sign in|start/i }).first();
    await expect(cta).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    // Desktop (xl+) shows the primary nav pills; below xl the nav lives
    // inside a collapsed "Menu" disclosure, so the nav element itself is
    // hidden. Either a visible nav or the Menu control counts as navigation.
    const visibleNav = page.locator("nav:visible").first();
    const menuButton = page.locator("summary, button").filter({ hasText: /menu/i }).first();
    await expect(visibleNav.or(menuButton).first()).toBeVisible();
  });
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

test.describe("Blog", () => {
  test("blog index page loads", async ({ page }) => {
    await page.goto("/blog");
    // Expect at least an h1 or heading
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });
});

// ─── Pricing ─────────────────────────────────────────────────────────────────

test.describe("Pricing", () => {
  test("pricing page loads and shows plan cards", async ({ page }) => {
    await page.goto("/pricing");
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
    // At least one pricing card or plan mention. Scope to main: the header's
    // desktop-only nav also matches (/free/ in "Free tools") but is hidden
    // below xl, which made .first() fail on the mobile project.
    const planText = page.locator("main").getByText(/professional|free|monthly|annually/i).first();
    await expect(planText).toBeVisible();
  });
});

// ─── Practice route (unauthenticated) ────────────────────────────────────────

test.describe("Practice page (unauthenticated)", () => {
  test("redirects or shows sign-in for unauthenticated users", async ({ page }) => {
    const response = await page.goto("/practice");

    // Assert the status FIRST. This test previously accepted any page carrying
    // the words "sign in" — which a 404 does, because the site header has a
    // sign-in link. It therefore passed for weeks while every protected route
    // returned 404 to signed-out visitors instead of a login prompt.
    expect(
      response?.status(),
      "a signed-out visitor must reach sign-in, not an error page"
    ).toBeLessThan(400);

    const currentUrl = page.url();
    const isAuthPage = currentUrl.includes("sign-in") ||
      currentUrl.includes("clerk") ||
      currentUrl.includes("accounts.");

    if (!isAuthPage) {
      const signInPrompt = page.getByText(/sign in|log in|create an account/i).first();
      await expect(signInPrompt).toBeVisible();
    }
    // Either way, they should NOT see the practice interface
    const startButton = page.getByRole("button", { name: /start interview|begin/i });
    await expect(startButton).toHaveCount(0);
  });
});

// ─── Progress page (unauthenticated) ─────────────────────────────────────────

test.describe("Progress page (unauthenticated)", () => {
  test("shows sign-in prompt for unauthenticated users", async ({ page }) => {
    await page.goto("/progress");
    const currentUrl = page.url();
    const isAuthPage = currentUrl.includes("sign-in") ||
      currentUrl.includes("clerk") ||
      currentUrl.includes("accounts.");

    if (!isAuthPage) {
      const signInPrompt = page.getByText(/sign in|log in|create an account/i).first();
      await expect(signInPrompt).toBeVisible();
    }
  });
});

// ─── 404 handling ─────────────────────────────────────────────────────────────

test.describe("404 page", () => {
  test("returns 404 for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz-abc-123");
    // Next.js 404 pages return 404 status
    expect(response?.status()).toBe(404);
  });
});

// ─── Core API health checks ──────────────────────────────────────────────────

test.describe("API health", () => {
  test("subscription API returns JSON", async ({ page }) => {
    const response = await page.request.get("/api/subscription");
    // 200 or 401 (unauthenticated) are both acceptable — just not 500
    expect([200, 401]).toContain(response.status());
    const body = await response.json().catch(() => null);
    // If 200, should be JSON object
    if (response.status() === 200) {
      expect(typeof body).toBe("object");
    }
  });
});

// ─── Mobile layout ───────────────────────────────────────────────────────────

test.describe("Mobile viewport", () => {
  test("homepage is usable on mobile", async ({ page }) => {
    // playwright.config already has a mobile project (iPhone 14)
    await page.goto("/");
    // The page should render without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 390;
    // Allow up to 16px slack for scrollbar etc.
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 16);
  });
});
