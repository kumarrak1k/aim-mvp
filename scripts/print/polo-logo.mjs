/**
 * Garment-print artwork: the AI Career Mentor lockup and bare mark as
 * single-colour WHITE art for a purple polo (print shops want one-colour
 * vector + high-res transparent PNG; white guarantees contrast on purple and
 * keeps embroidery to a single thread).
 *
 * Outputs (marketing/print/polo/):
 *   polo-lockup-white.svg / .png   full "AI CAREER MENTOR" lockup, white
 *   polo-mark-white.svg / .png     bare mark (sleeve / collar / big back print)
 *   polo-mockup.png                both on the polo purple, for a quick look
 *
 * PNGs are 4000px wide with transparent grounds — 300dpi at ~34cm, more than
 * any polo print needs. Left-chest convention: print the lockup 90-100mm wide.
 *
 * Run: node scripts/print/polo-logo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const OUT = "marketing/print/polo";
mkdirSync(OUT, { recursive: true });

// One-colour white lockup: every brand colour in the source collapses to white.
const lockup = readFileSync("public/brand/logo-lockup-light.svg", "utf8")
  .replaceAll("#9B4EE3", "#FFFFFF")
  .replaceAll("#07030D", "#FFFFFF");
writeFileSync(`${OUT}/polo-lockup-white.svg`, lockup);

const mark = readFileSync("public/brand/logo-mono.svg", "utf8")
  .replaceAll("currentColor", "#FFFFFF");
writeFileSync(`${OUT}/polo-mark-white.svg`, mark);

// High-res transparent PNGs.
await sharp(Buffer.from(lockup), { density: 900 })
  .resize({ width: 4000 })
  .png()
  .toFile(`${OUT}/polo-lockup-white.png`);
await sharp(Buffer.from(mark), { density: 900 })
  .resize({ width: 2000 })
  .png()
  .toFile(`${OUT}/polo-mark-white.png`);

// Mockup: the artwork on a flat polo-purple ground so the contrast can be
// judged at a glance. Two common polo purples shown side by side.
const b64 = (s) => Buffer.from(s).toString("base64");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1600px;font-family:ui-sans-serif,system-ui,sans-serif;display:flex}
  .half{width:800px;height:900px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:70px}
  .deep{background:#3b2064}
  .bright{background:#5b21b6}
  img.lockup{width:520px}
  img.mark{width:150px}
  .tag{color:rgba(255,255,255,.55);font-size:20px;font-weight:700}
</style></head><body>
  <div class="half deep">
    <img class="lockup" src="data:image/svg+xml;base64,${b64(lockup)}"/>
    <img class="mark" src="data:image/svg+xml;base64,${b64(mark)}"/>
    <div class="tag">deep purple polo</div>
  </div>
  <div class="half bright">
    <img class="lockup" src="data:image/svg+xml;base64,${b64(lockup)}"/>
    <img class="mark" src="data:image/svg+xml;base64,${b64(mark)}"/>
    <div class="tag">bright purple polo</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/polo-mockup.png` });
await browser.close();
console.log(`done → ${OUT}/`);
