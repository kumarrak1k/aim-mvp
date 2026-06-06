// Render one 1920x1080 slide per scene: the RAW screenshot full-bleed (fills the
// frame — no dark borders), with a bottom caption over a gradient scrim.
// Run: node scripts/video/render-slides.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { CANDIDATE_SCENES } from "./scenes.mjs";

const SRC = "marketing/screenshots"; // raw retina captures (2880x1800), no frame
const OUT = "marketing/video/slides";
mkdirSync(OUT, { recursive: true });

const slide = (b64, caption) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1920px;height:1080px;overflow:hidden;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .slide{position:relative;width:1920px;height:1080px;overflow:hidden;background:#08040f}
  /* full-bleed: fill the width; 16:10 source crops ~60px top/bottom, no side bars */
  .shot{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1920px;height:auto;display:block}
  .scrim{position:absolute;left:0;right:0;bottom:0;height:320px;
    background:linear-gradient(0deg,rgba(8,4,15,.97) 0%,rgba(8,4,15,.82) 38%,rgba(8,4,15,0) 100%)}
  .cap{position:absolute;left:0;right:0;bottom:86px;text-align:center;font-size:64px;font-weight:900;
    letter-spacing:-.035em;line-height:1.05;color:#fff;padding:0 110px;text-shadow:0 6px 30px rgba(0,0,0,.55)}
</style></head><body>
  <div class="slide">
    <img class="shot" src="data:image/png;base64,${b64}"/>
    <div class="scrim"></div>
    <div class="cap">${caption}</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
// 2x device scale → 3840x2160 slides, so the Ken-Burns zoom has real pixels to
// work with (smooth, not soft).
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
let n = 0;
for (const s of CANDIDATE_SCENES) {
  const src = `${SRC}/${s.image}`;
  if (!existsSync(src)) { console.log("skip (missing screenshot)", s.image); continue; }
  const b64 = readFileSync(src).toString("base64");
  await page.setContent(slide(b64, s.caption), { waitUntil: "load" });
  await page.locator("img.shot").waitFor({ state: "visible" });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${s.id}.png` });
  console.log("slide", s.id);
  n++;
}
await browser.close();
console.log(`done — ${n} full-bleed slides → ${OUT}`);
