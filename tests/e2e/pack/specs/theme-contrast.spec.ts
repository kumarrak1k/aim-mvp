/**
 * Signed-in theme contrast audit: loads the key authenticated surfaces in
 * BOTH themes (dark default + light) and fails on any axe color-contrast
 * violation. Complements scripts/audit-theme-contrast.mjs, which covers the
 * public routes unauthenticated — together they gate the light-theme release.
 *
 * Uses the professional persona so plan-gated surfaces (career docs, custom
 * sessions, analytics) render their full UI rather than upgrade walls.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { statePath } from "../fixtures/env";

const AXE_SOURCE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const ROUTES = [
  "/practice",
  "/progress",
  "/profile",
  "/career-docs/cv-enhancer",
  "/career-docs/cover-letter",
  "/career-docs/personal-statement",
  "/assessment-centre",
  "/account/notifications",
  "/refer",
  "/guide",
];

for (const theme of ["dark", "light"] as const) {
  test.describe(`authed contrast — ${theme}`, () => {
    test.use({ storageState: statePath("professional") });

    for (const route of ROUTES) {
      test(`${route} passes color-contrast in ${theme}`, async ({ page }) => {
        await page.addInitScript((t) => {
          try {
            localStorage.setItem("theme-mode", t);
          } catch {}
        }, theme);
        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate(AXE_SOURCE);
        const violations = await page.evaluate(async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = await (window as any).axe.run(document, {
            runOnly: ["color-contrast"],
            resultTypes: ["violations"],
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return r.violations.flatMap((v: any) =>
            v.nodes.slice(0, 6).map((n: any) => ({
              target: n.target[0],
              data: n.any[0]?.data
                ? `fg ${n.any[0].data.fgColor} on ${n.any[0].data.bgColor} ratio ${n.any[0].data.contrastRatio}`
                : v.help,
              text: (n.html.replace(/<[^>]+>/g, "").trim() || n.html).slice(0, 50),
            }))
          );
        });
        expect(
          violations,
          `contrast violations on ${route} (${theme}):\n` +
            violations.map((v: { data: string; text: string; target: string }) => `  ${v.data} | "${v.text}" | ${v.target}`).join("\n")
        ).toEqual([]);
      });
    }
  });
}
