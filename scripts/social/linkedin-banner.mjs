/**
 * LinkedIn Company Page cover, matching the Facebook cover's design language
 * (same gradient ground, lockup, "Practise like it's real." tagline) at
 * LinkedIn's 1128x191 shape — rendered at 2x (2256x382) for sharpness.
 *
 * The page logo overlays the cover's lower-left on desktop, so everything
 * sits centred with generous side margins; mobile crops the sides.
 *
 * Run: node scripts/social/linkedin-banner.mjs
 */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const OUT = "marketing/social";
mkdirSync(OUT, { recursive: true });

const LOGO =
  "data:image/svg+xml;base64," +
  readFileSync("public/brand/logo-lockup.svg").toString("base64");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1128px;height:191px;overflow:hidden;
       font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
       background:
         radial-gradient(700px 400px at 18% -30%, rgba(168,85,247,.5), transparent 62%),
         radial-gradient(600px 350px at 92% 130%, rgba(232,80,180,.38), transparent 62%),
         linear-gradient(160deg,#2b1655 0%,#1a0f33 55%,#140a26 100%);
       display:flex;align-items:center;justify-content:center;gap:44px;color:#F8F4FF}
  .lockup{height:104px;width:auto;display:block}
  .divider{width:2px;height:96px;background:rgba(255,255,255,.18);border-radius:1px}
  .tag .main{font-size:36px;font-weight:800;letter-spacing:-.02em}
  .tag .sub{margin-top:8px;font-size:16px;font-weight:600;color:#CFC6E6}
</style></head><body>
  <img class="lockup" src="${LOGO}"/>
  <div class="divider"></div>
  <div class="tag">
    <div class="main">Practise like it&rsquo;s real.</div>
    <div class="sub">Real interview practice &middot; honest scores &middot; aicareermentor.co.uk</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1128, height: 191 },
  deviceScaleFactor: 2,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/linkedin-banner.png` });
await browser.close();
console.log(`done -> ${OUT}/linkedin-banner.png (2256x382)`);
