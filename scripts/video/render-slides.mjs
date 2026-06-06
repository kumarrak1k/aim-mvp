// Render one 1920x1080 slide PNG per scene (framed screenshot + caption, on a
// dark brand backdrop). No audio/ffmpeg here. Run: node scripts/video/render-slides.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { CANDIDATE_SCENES } from "./scenes.mjs";

const OUT = "marketing/video/slides";
mkdirSync(OUT, { recursive: true });

const slide = (b64, caption) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1920px;height:1080px;overflow:hidden;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .slide{width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:56px;padding:70px;
    background:
      radial-gradient(1500px 720px at 50% -12%, rgba(168,85,247,.20), transparent 60%),
      linear-gradient(160deg,#130b27 0%,#08040f 62%,#060309 100%)}
  .shot{max-width:1500px;max-height:680px;width:auto;height:auto;border-radius:14px;
    box-shadow:0 44px 110px -24px rgba(0,0,0,.75)}
  .cap{max-width:1480px;text-align:center;font-size:60px;font-weight:900;
    letter-spacing:-.035em;line-height:1.04;color:#fff}
</style></head><body>
  <div class="slide">
    <img class="shot" src="data:image/png;base64,${b64}"/>
    <div class="cap">${caption}</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
let n = 0;
for (const s of CANDIDATE_SCENES) {
  const src = `marketing/framed/${s.image}`;
  if (!existsSync(src)) { console.log("skip (missing framed)", s.image); continue; }
  const b64 = readFileSync(src).toString("base64");
  await page.setContent(slide(b64, s.caption), { waitUntil: "load" });
  await page.locator("img.shot").waitFor({ state: "visible" });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${s.id}.png` });
  console.log("slide", s.id);
  n++;
}
await browser.close();
console.log(`done — ${n} slides → ${OUT}`);
