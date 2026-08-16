/**
 * YouTube channel banner: 2048x1152, but EVERYTHING important must sit in
 * the central 1235x338 "safe area" (all that's guaranteed visible on every
 * device — TV crops least, mobile crops most). Same design language as the
 * Facebook/LinkedIn covers.
 *
 * Run: node scripts/social/youtube-banner.mjs
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
  body{width:2048px;height:1152px;overflow:hidden;
       font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
       background:
         radial-gradient(1300px 750px at 18% -30%, rgba(168,85,247,.5), transparent 62%),
         radial-gradient(1100px 650px at 92% 130%, rgba(232,80,180,.38), transparent 62%),
         linear-gradient(160deg,#2b1655 0%,#1a0f33 55%,#140a26 100%);
       display:flex;align-items:center;justify-content:center;color:#F8F4FF}
  /* safe area: 1235x338 centred — keep every element inside it */
  .safe{width:1235px;height:338px;display:flex;align-items:center;
        justify-content:center;gap:56px}
  .lockup{height:150px;width:auto;display:block}
  .divider{width:3px;height:140px;background:rgba(255,255,255,.18);border-radius:2px}
  .tag .main{font-size:54px;font-weight:800;letter-spacing:-.02em}
  .tag .sub{margin-top:12px;font-size:24px;font-weight:600;color:#CFC6E6}
</style></head><body>
  <div class="safe">
    <img class="lockup" src="${LOGO}"/>
    <div class="divider"></div>
    <div class="tag">
      <div class="main">Practise like it&rsquo;s real.</div>
      <div class="sub">Real interview practice &middot; honest scores &middot; aicareermentor.co.uk</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2048, height: 1152 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/youtube-banner.png` });
await browser.close();
console.log(`done -> ${OUT}/youtube-banner.png (2048x1152, safe-area centred)`);
