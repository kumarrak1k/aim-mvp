// Wrap raw app screenshots in a branded browser frame on a purple gradient.
// Pure composition (no dev server). Run: node scripts/frame-screenshots.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, existsSync } from "node:fs";

const SHOTS = [
  { in: "candidate-01-setup.png", path: "/practice" },
  { in: "candidate-02-question.png", path: "/practice" },
  { in: "candidate-03-feedback.png", path: "/practice" },
  { in: "candidate-04-summary.png", path: "/practice" },
  { in: "candidate-05-progress.png", path: "/progress" },
  { in: "candidate-06-voice-camera.png", path: "/practice" },
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
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1568, height: 1180 } });
let n = 0;
for (const s of SHOTS) {
  const src = `marketing/screenshots/${s.in}`;
  if (!existsSync(src)) { console.log("skip (missing)", s.in); continue; }
  const b64 = readFileSync(src).toString("base64");
  await page.setContent(html(b64, s.path), { waitUntil: "load" });
  await page.locator("img.shot").waitFor({ state: "visible" });
  await page.waitForTimeout(200);
  await page.locator(".stage").screenshot({ path: `marketing/framed/${s.in}` });
  console.log("framed", s.in);
  n++;
}
await browser.close();
console.log(`done — ${n} framed → marketing/framed/`);
