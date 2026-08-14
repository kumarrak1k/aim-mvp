// Wrap raw app screenshots in a branded browser frame on a purple gradient,
// then publish them straight to public/marketing as WebP.
// Pure composition (no dev server). Run: node scripts/frame-screenshots.mjs
//
// The publish step lives here on purpose. It used to be a manual resize, and a
// hand-run pass once wrote 1200x750 files into a slot the page renders at
// 2000px wide — every homepage shot was upscaled and soft for weeks with
// nothing to catch it. One command now owns capture width through to the
// published asset, and it fails loudly if a source is too small to fill it.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

// Published width. The shots open full-size in a lightbox, so this is the
// resolution the reader can actually zoom into; next/image derives the smaller
// srcset entries for the thumbnails from it.
const PUBLISH_WIDTH = 2600;
const PUBLIC_DIR = "public/marketing";

const SHOTS = [
  { in: "candidate-01-setup.png", path: "/practice" },
  { in: "candidate-02-question.png", path: "/practice" },
  { in: "candidate-03-feedback.png", path: "/practice" },
  { in: "candidate-04-summary.png", path: "/practice" },
  { in: "candidate-05-progress.png", path: "/progress" },
  { in: "corporate-01-dashboard.png", path: "/company/dashboard" },
  { in: "ac-01-landing.png", path: "/assessment-centre" },
];

const html = (b64, path) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:#070310}
  .stage{width:1568px;padding:64px;
    background:
      radial-gradient(1200px 620px at 28% -12%, rgba(168,85,247,.38), transparent 60%),
      radial-gradient(900px 520px at 92% 112%, rgba(99,102,241,.30), transparent 60%),
      linear-gradient(160deg,#170b30 0%,#0a0614 55%,#070310 100%);
    display:flex;align-items:center;justify-content:center;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .window{width:1440px;border-radius:16px;overflow:hidden;
    border:1px solid rgba(255,255,255,.10);
    box-shadow:0 50px 120px -20px rgba(0,0,0,.75),0 0 0 1px rgba(168,85,247,.10)}
  .bar{height:44px;display:flex;align-items:center;gap:8px;padding:0 18px;
    background:#15101f;border-bottom:1px solid rgba(255,255,255,.06)}
  .dot{width:12px;height:12px;border-radius:50%}
  .red{background:#ff5f57}.amber{background:#febc2e}.green{background:#28c840}
  .url{margin-left:14px;color:#c4b5e8;font-size:13px;letter-spacing:.2px;
    background:rgba(255,255,255,.06);padding:5px 16px;border-radius:999px}
  .shot{display:block;width:1440px;height:auto}
</style></head><body>
  <div class="stage"><div class="window">
    <div class="bar"><span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span>
      <span class="url">aicareermentor.co.uk${path}</span></div>
    <img class="shot" src="data:image/png;base64,${b64}"/>
  </div></div>
</body></html>`;

mkdirSync("marketing/framed", { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });
const browser = await chromium.launch();
// 3x to match the capture config: the raw shot is 4320px wide and sits in a
// 1440px-wide window, so this reproduces it pixel-for-pixel with no resampling.
const page = await browser.newPage({ deviceScaleFactor: 3, viewport: { width: 1568, height: 1180 } });
let n = 0;
const undersized = [];
for (const s of SHOTS) {
  const src = `marketing/screenshots/${s.in}`;
  if (!existsSync(src)) { console.log("skip (missing)", s.in); continue; }
  const b64 = readFileSync(src).toString("base64");
  await page.setContent(html(b64, s.path), { waitUntil: "load" });
  await page.locator("img.shot").waitFor({ state: "visible" });
  await page.waitForTimeout(200);
  const framed = `marketing/framed/${s.in}`;
  await page.locator(".stage").screenshot({ path: framed });

  const out = `${PUBLIC_DIR}/${s.in.replace(/\.png$/, ".webp")}`;
  const meta = await sharp(framed).metadata();
  if (meta.width < PUBLISH_WIDTH) undersized.push(`${s.in} (${meta.width}px)`);
  const info = await sharp(framed)
    .resize({ width: PUBLISH_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);
  console.log(`  ${s.in.padEnd(30)} framed ${meta.width}x${meta.height} -> ${info.width}x${info.height} webp ${Math.round(info.size / 1024)}KB`);
  n++;
}
await browser.close();
console.log(`done — ${n} shots framed and published to ${PUBLIC_DIR}/`);
if (undersized.length) {
  console.error(`\nFAIL: framed below the ${PUBLISH_WIDTH}px publish width, so these were NOT upscaled and will look soft:\n  ${undersized.join("\n  ")}\nRe-run the capture at deviceScaleFactor 3.`);
  process.exit(1);
}
