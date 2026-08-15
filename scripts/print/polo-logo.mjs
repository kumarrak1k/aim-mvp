/**
 * Garment-print artwork from the REAL stacked brand lockup
 * (public/brand/logo-lockup.svg: gradient mark · divider · AI / CAREER /
 * MENTOR), in two colourways for a purple polo:
 *
 *   polo-lockup-colour.*  the brand lockup as-is — gradient mark, purple AI,
 *                         white text (needs DTG/DTF printing for the gradient)
 *   polo-lockup-white.*   same geometry, every element pure white — the
 *                         single-colour version for screen print / embroidery
 *
 * Outputs (marketing/print/polo/): SVG + 4000px transparent PNG each, plus
 * polo-mockup.png showing both colourways on two polo purples.
 * Left-chest convention: print the lockup 80-90mm wide.
 *
 * Run: node scripts/print/polo-logo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const OUT = "marketing/print/polo";
mkdirSync(OUT, { recursive: true });

const colour = readFileSync("public/brand/logo-lockup.svg", "utf8");
writeFileSync(`${OUT}/polo-lockup-colour.svg`, colour);

// Single-colour white: gradient strokes, the purple AI, the near-white text
// and the divider all collapse to pure white.
const white = colour
  .replaceAll('stroke="url(#g)"', 'stroke="#FFFFFF"')
  .replaceAll("#A855F7", "#FFFFFF")
  .replaceAll("#F8F4FF", "#FFFFFF")
  .replaceAll('stroke="#4F2876"', 'stroke="#FFFFFF"');
writeFileSync(`${OUT}/polo-lockup-white.svg`, white);

for (const [name, svg] of [["polo-lockup-colour", colour], ["polo-lockup-white", white]]) {
  await sharp(Buffer.from(svg), { density: 1200 })
    .resize({ width: 4000 })
    .png()
    .toFile(`${OUT}/${name}.png`);
}

// Mockup: both colourways on two common polo purples.
const b64 = (s) => Buffer.from(s).toString("base64");
const cell = (bg, svg, tag) => `
  <div class="half" style="background:${bg}">
    <img src="data:image/svg+xml;base64,${b64(svg)}"/>
    <div class="tag">${tag}</div>
  </div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1600px;font-family:ui-sans-serif,system-ui,sans-serif;
       display:grid;grid-template-columns:1fr 1fr}
  .half{height:450px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:44px}
  img{width:440px}
  .tag{color:rgba(255,255,255,.55);font-size:19px;font-weight:700}
</style></head><body>
  ${cell("#3b2064", colour, "colour · deep purple")}
  ${cell("#5b21b6", colour, "colour · bright purple")}
  ${cell("#3b2064", white, "all white · deep purple")}
  ${cell("#5b21b6", white, "all white · bright purple")}
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/polo-mockup.png` });
await browser.close();
console.log(`done → ${OUT}/`);
