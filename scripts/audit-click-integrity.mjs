// Click-integrity audit: on every public route, in both themes, hit-test the
// interactive elements (header/nav/footer links, buttons, primary CTAs) by
// asking the browser what actually receives a click at each element's centre.
// Catches the whole class of "layout overlay swallows clicks" bugs that
// colour audits can't see (z-index, absolute positioning, collapsed rows).
//
// Run (dev server on :3001 first):  node scripts/audit-click-integrity.mjs
// AUDIT_BASE overrides the target. Exit 1 on any blocked element.
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3001";

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

const browser = await chromium.launch();
let blocked = 0;
const report = [];

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("theme-mode", t);
      // Pre-dismiss the cookie banner so it can't legitimately cover CTAs.
      localStorage.setItem("aim_cookie_consent", JSON.stringify({ analytics: false, at: Date.now() }));
    } catch {}
  }, theme);
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch {
      report.push(`${theme} ${route}: LOAD FAILED`);
      blocked++;
      continue;
    }
    // Belt and braces: click any visible cookie-dismiss button.
    await page
      .locator("button", { hasText: /essential only|nur erforderliche/i })
      .first()
      .click({ timeout: 1500 })
      .catch(() => {});

    const failures = await page.evaluate(() => {
      const out = [];
      const scopes = document.querySelectorAll("header, nav, aside, footer, main");
      const seen = new Set();
      for (const scope of scopes) {
        for (const el of scope.querySelectorAll("a[href], button")) {
          if (seen.has(el)) continue;
          seen.add(el);
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue; // hidden/collapsed
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.pointerEvents === "none") continue;
          el.scrollIntoView({ block: "center", behavior: "instant" });
          const r2 = el.getBoundingClientRect();
          const hit = document.elementFromPoint(
            r2.left + r2.width / 2,
            Math.min(Math.max(r2.top + r2.height / 2, 1), innerHeight - 1)
          );
          if (!hit) continue;
          if (el.contains(hit) || hit.contains(el)) continue;
          // The floating chat launcher legitimately overlays the page corner.
          if (hit.closest('[class*="z-[60]"]')) continue;
          out.push({
            label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
            blockedBy: `${hit.tagName}.${(hit.className.toString() || "").slice(0, 60)}`,
          });
        }
      }
      return out;
    });

    if (failures.length) {
      blocked += failures.length;
      report.push(`\n== ${theme.toUpperCase()} ${route} — ${failures.length} blocked element(s)`);
      for (const f of failures) report.push(`   "${f.label}" blocked by ${f.blockedBy}`);
    }
  }
  await ctx.close();
}

await browser.close();
console.log(report.join("\n") || "All interactive elements receive their clicks in both themes.");
console.log(`\nTOTAL blocked: ${blocked} across ${ROUTES.length} routes x 2 themes`);
process.exit(blocked ? 1 : 0);
