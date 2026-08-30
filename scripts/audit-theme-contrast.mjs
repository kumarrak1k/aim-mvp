// Theme contrast audit: loads every public route in BOTH themes against a
// running dev server and reports axe color-contrast violations per page.
// The light theme flipped ~3k colour call sites via tokens; this proves the
// flip everywhere instead of trusting spot checks.
//
// Run (dev server on :3001 first):  node scripts/audit-theme-contrast.mjs
// Exit code 1 when any violation is found.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3001";

// Public, unauthenticated routes. Signed-in surfaces get audited via the
// capture harness (authed storage state) in a separate pass.
const ROUTES = [
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/interview-practice",
  "/mock-assessment-centre",
  "/for-candidates",
  "/for-candidates/pricing",
  "/for-candidates/sign-up",
  "/for-candidates/sign-in",
  "/blog",
  "/guide",
  "/questions",
  "/tools/star-scorer",
  "/compare",
  "/privacy",
  "/terms",
  "/security",
  "/press",
  "/refer",
  "/universities",
  "/for-business",
  "/for-business/pricing",
];

const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const browser = await chromium.launch();
let totalViolations = 0;
const summary = [];

for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("theme-mode", t);
    } catch {}
  }, theme);
  const page = await context.newPage();

  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch {
      summary.push(`${theme} ${route}: LOAD FAILED`);
      totalViolations++;
      continue;
    }
    await page.evaluate(axeSource);
    const result = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: ["color-contrast"],
        resultTypes: ["violations"],
      });
      return r.violations.flatMap((v) =>
        v.nodes.slice(0, 8).map((n) => ({
          target: n.target[0],
          summary: (n.any[0]?.data
            ? `fg ${n.any[0].data.fgColor} on ${n.any[0].data.bgColor} ratio ${n.any[0].data.contrastRatio}`
            : v.help
          ).slice(0, 120),
          text: (n.html.replace(/<[^>]+>/g, "").trim() || n.html).slice(0, 60),
        }))
      );
    });
    if (result.length) {
      totalViolations += result.length;
      summary.push(`\n== ${theme.toUpperCase()} ${route} — ${result.length} violation(s)`);
      for (const v of result) summary.push(`   ${v.summary} | "${v.text}" | ${v.target}`);
    }
  }
  await context.close();
}

await browser.close();
console.log(summary.join("\n") || "No color-contrast violations in either theme.");
console.log(`\nTOTAL: ${totalViolations} violation node(s) across ${ROUTES.length} routes x 2 themes`);
process.exit(totalViolations ? 1 : 0);
