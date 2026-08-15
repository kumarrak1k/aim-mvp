/**
 * Print-ready A5 flyers for the Summer 2026 hand-out campaign.
 *
 * Two designs, both 148x210mm with full-bleed background, PDF (vector text,
 * printBackground) + a PNG preview each:
 *   A "offer"  — offer-led: big 50% OFF card, code + QR
 *   B "story"  — story-led: recognition hook + product screenshot, offer strip
 *
 * The QR encodes https://aicareermentor.co.uk/?promo=SUMMER2026 — the site's
 * attribution capture stores the promo and checkout pre-applies it, so a scan
 * needs no typing; the printed code covers people who type the URL instead.
 *
 * Run:  node scripts/print/flyer-summer2026.mjs
 *       (regenerate marketing/print-qr-summer2026.png first if the URL changes)
 */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const OUT = "marketing/print";
mkdirSync(OUT, { recursive: true });

const b64 = (p) => readFileSync(p).toString("base64");
const LOGO = "data:image/svg+xml;base64," + b64("public/brand/logo-lockup.svg");
const QR = "data:image/png;base64," + b64("marketing/print-qr-summer2026.png");
const SHOT = "data:image/png;base64," + b64("marketing/framed/candidate-03-feedback.png");

const BG = `
  radial-gradient(120mm 80mm at 25% -8%, rgba(168,85,247,.5), transparent 62%),
  radial-gradient(100mm 70mm at 90% 108%, rgba(232,80,180,.38), transparent 62%),
  linear-gradient(160deg,#2b1655 0%,#1a0f33 55%,#140a26 100%)`;

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:148mm 210mm;margin:0}
  html,body{width:148mm;height:210mm;overflow:hidden}
  body{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
       background:${BG};color:#F8F4FF;position:relative;
       display:flex;flex-direction:column;padding:11mm 11mm 8mm}
  .lockup{display:flex;align-items:center;justify-content:space-between}
  .lockup img{height:11mm;width:auto}
  .lockup .site{font-size:3.6mm;font-weight:700;color:#CFC6E6}
  .terms{font-size:2.7mm;line-height:1.5;color:#B9AEDA;text-align:center}
`;

// ── Design A: offer-led ───────────────────────────────────────────────────────
const flyerA = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .head{margin-top:5mm;text-align:center}
  .kicker{font-size:3.4mm;font-weight:800;letter-spacing:.18em;color:#F0ABFC;text-transform:uppercase}
  h1{margin-top:2.6mm;font-size:10.6mm;font-weight:800;letter-spacing:-.02em;line-height:1.04}
  .sub{margin:4mm auto 0;max-width:110mm;font-size:4mm;line-height:1.5;color:#D9CFF2}
  .points{margin-top:6mm;display:flex;flex-direction:column;gap:2.2mm}
  .pt{display:flex;gap:3mm;align-items:flex-start;background:rgba(255,255,255,.05);
      border:0.3mm solid rgba(255,255,255,.13);border-radius:3.5mm;padding:3.2mm 4mm}
  .pt .tick{color:#7CF7C4;font-weight:800;font-size:3.8mm;line-height:1.4}
  .pt .txt{font-size:3.6mm;line-height:1.45;color:#EFE9FB}
  .offer{margin-top:6mm;background:#fff;color:#140a26;border-radius:5mm;
         padding:6mm 7mm;display:flex;align-items:center;gap:6mm;
         box-shadow:0 4mm 10mm rgba(0,0,0,.35)}
  .off-l{flex:1}
  .fifty{font-size:15mm;font-weight:800;letter-spacing:-.03em;line-height:.95}
  .fifty small{font-size:6mm;letter-spacing:0}
  .off-what{margin-top:1.6mm;font-size:3.7mm;font-weight:700;color:#4c3a75}
  .code{margin-top:3.4mm;display:inline-block;background:#140a26;color:#F0ABFC;
        font-weight:800;font-size:4.6mm;letter-spacing:.14em;border-radius:2.4mm;
        padding:2.4mm 4.6mm}
  .qr{width:34mm;height:34mm;display:block}
  .scan{margin-top:1.6mm;text-align:center;font-size:2.9mm;font-weight:700;color:#4c3a75}
  .spacer{flex:1}
</style></head><body>
  <div class="lockup"><img src="${LOGO}"/><span class="site">aicareermentor.co.uk</span></div>
  <div class="head">
    <div class="kicker">Your next move</div>
    <h1>New role? First job?<br/>Career change?</h1>
    <p class="sub">Whatever you&rsquo;re aiming for, AI Career Mentor gets you ready to land it &mdash; from a sharper application to interview answers you&rsquo;ve actually tested out loud.</p>
  </div>
  <div class="points">
    <div class="pt"><span class="tick">&#10003;</span><span class="txt"><b>Start with the application</b> &mdash; CV, cover letter and personal statement, sharpened in the Studio.</span></div>
    <div class="pt"><span class="tick">&#10003;</span><span class="txt"><b>Practise the interview out loud</b> &mdash; honest scores on your answers, delivery and presence, with model answers to learn from.</span></div>
    <div class="pt"><span class="tick">&#10003;</span><span class="txt"><b>Walk in knowing where you stand</b> &mdash; every session saved, so you can see yourself improving.</span></div>
  </div>
  <div class="spacer"></div>
  <div class="offer">
    <div class="off-l">
      <div class="fifty">50<small>%</small> OFF</div>
      <div class="off-what">your first payment &mdash; any plan</div>
      <span class="code">SUMMER2026</span>
    </div>
    <div><img class="qr" src="${QR}"/><div class="scan">Scan to claim</div></div>
  </div>
  <div style="height:4mm"></div>
  <p class="terms">Scan the code or visit <b>aicareermentor.co.uk</b> and use <b>SUMMER2026</b> at checkout.<br/>50% off your first payment on any Plus or Professional plan, monthly or yearly. Valid until 30 September 2026.</p>
</body></html>`;

// ── Design B: story-led ───────────────────────────────────────────────────────
const flyerB = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  .head{margin-top:7mm;text-align:center}
  .kicker{font-size:3.2mm;font-weight:800;letter-spacing:.18em;color:#F0ABFC;text-transform:uppercase;margin-bottom:2.6mm}
  h1{font-size:8.6mm;font-weight:800;letter-spacing:-.02em;line-height:1.18}
  h1 .dim{color:#CDA9F5}
  .sub{margin:4mm auto 0;max-width:112mm;font-size:3.8mm;line-height:1.55;color:#D9CFF2}
  .shotwrap{width:86%;margin:5mm auto 0;border-radius:4mm;overflow:hidden;
            box-shadow:0 5mm 12mm rgba(0,0,0,.45)}
  .shotwrap img{display:block;width:100%;height:auto}
  .strip{margin-top:6mm;background:#fff;color:#140a26;border-radius:4.5mm;
         padding:4.6mm 6mm;display:flex;align-items:center;gap:5mm;
         box-shadow:0 4mm 10mm rgba(0,0,0,.35)}
  .fifty{font-size:11.4mm;font-weight:800;letter-spacing:-.03em;line-height:.95}
  .fifty small{font-size:4.6mm}
  .off-what{margin-top:1.2mm;font-size:3.2mm;font-weight:700;color:#4c3a75}
  .code{margin-top:2.4mm;display:inline-block;background:#140a26;color:#F0ABFC;
        font-weight:800;font-size:3.9mm;letter-spacing:.14em;border-radius:2mm;
        padding:1.9mm 3.8mm}
  .off-l{flex:1}
  .qr{width:27mm;height:27mm;display:block}
  .scan{margin-top:1.2mm;text-align:center;font-size:2.6mm;font-weight:700;color:#4c3a75}
  .spacer{flex:1}
</style></head><body>
  <div class="lockup"><img src="${LOGO}"/><span class="site">aicareermentor.co.uk</span></div>
  <div class="head">
    <div class="kicker">New role &middot; First job &middot; Career change</div>
    <h1>You rehearse it in your head.<br/><span class="dim">You still have no idea if you&rsquo;re any good.</span></h1>
    <p class="sub">AI Career Mentor puts you in a real interview &mdash; questions read aloud, your spoken answers scored on content, delivery and presence, with a model answer to learn from. So when the real one comes, you&rsquo;ve already done it.</p>
  </div>
  <div class="shotwrap"><img src="${SHOT}"/></div>
  <div class="spacer"></div>
  <div class="strip">
    <div class="off-l">
      <div class="fifty">50<small>%</small> OFF</div>
      <div class="off-what">your first payment &mdash; any plan</div>
      <span class="code">SUMMER2026</span>
    </div>
    <div><img class="qr" src="${QR}"/><div class="scan">Scan to claim</div></div>
  </div>
  <div style="height:3.4mm"></div>
  <p class="terms">Scan the code or visit <b>aicareermentor.co.uk</b> and use <b>SUMMER2026</b> at checkout.<br/>50% off your first payment on any Plus or Professional plan, monthly or yearly. Valid until 30 September 2026.</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 3 });

for (const [name, html] of [["flyer-A-offer", flyerA], ["flyer-B-story", flyerB]]) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.pdf({
    path: `${OUT}/${name}.pdf`,
    width: "148mm",
    height: "210mm",
    printBackground: true,
    pageRanges: "1",
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("built", name);
}
await browser.close();
console.log(`done → ${OUT}/`);
