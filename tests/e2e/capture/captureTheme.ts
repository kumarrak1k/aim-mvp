import { test } from "@playwright/test";

/**
 * Which theme the website screenshots are captured in.
 *
 * The site shows its product screenshots in the viewer's own theme, so the
 * published set exists twice. Capture each with CAPTURE_THEME=dark (default)
 * or CAPTURE_THEME=light, then frame both with scripts/frame-screenshots.mjs.
 */
export const CAPTURE_THEME: "dark" | "light" =
  process.env.CAPTURE_THEME === "light" ? "light" : "dark";

/** Raw captures for each theme land in their own folder. */
export const CAPTURE_DIR =
  CAPTURE_THEME === "light" ? "marketing/screenshots-site-light" : "marketing/screenshots";

/**
 * Render every page in the capture theme. The anti-flash head script reads
 * theme-mode before first paint, so seeding it from an init script is enough.
 */
export function useCaptureTheme(): void {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((mode) => {
      try {
        localStorage.setItem("theme-mode", mode);
      } catch {
        // Storage blocked: the attributes below still set the theme.
      }
      document.documentElement.setAttribute("data-theme-mode", mode);
      document.documentElement.setAttribute("data-theme", mode);
    }, CAPTURE_THEME);
  });
}
