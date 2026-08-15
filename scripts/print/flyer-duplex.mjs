/**
 * Double-sided A5 flyer for the Summer 2026 hand-out campaign — ONE 2-page
 * PDF (page 1 = front, page 2 = back) plus a PNG preview of each side.
 *
 * Front (from the story design): audience strip, recognition hook, product
 * screenshot, and a "flip for 50% off" pull — no offer block, its job is to
 * stop the reader and earn the turn.
 * Back (from the offer design): the question headline, the journey points,
 * and the full offer card + code + QR + terms — its job is to convert.
 *
 * Run: node scripts/print/flyer-duplex.mjs
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:148mm 210mm;margin:0}
  body{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;color:#F8F4FF}
  .sheet{width:148mm;height:210mm;overflow:hidden;background:${BG};
         display:flex;flex-direction:column;padding:11mm 11mm 8mm;
         page-break-after:always;position:relative}
  .sheet:last-child{page-break-after:auto}
  .lockup{display:flex;align-items:center;justify-content:space-between}
  .lockup img{height:11mm;width:auto}
  .lockup .site{font-size:3.6mm;font-weight:700;color:#CFC6E6}
  .kicker{font-size:3.2mm;font-weight:800;letter-spacing:.18em;color:#F0ABFC;
          text-transform:uppercase}
  .terms{font-size:2.7mm;line-height:1.5;color:#B9AEDA;text-align:center}
  .spacer{flex:1}

  /* front */
  .f-head{margin-top:8mm;text-align:center}
  .f-head .kicker{margin-bottom:2.8mm}
  .f-h1{font-size:9.2mm;font-weight:800;letter-spacing:-.02em;line-height:1.18}
  .f-h1 .dim{color:#CDA9F5}
  .f-sub{margin:4.4mm auto 0;max-width:112mm;font-size:3.9mm;line-height:1.55;color:#D9CFF2}
  .shotwrap{width:88%;margin:6mm auto 0;border-radius:4mm;overflow:hidden;
            box-shadow:0 5mm 12mm rgba(0,0,0,.45)}
  .shotwrap img{display:block;width:100%;height:auto}
  .flip{margin:0 auto;background:#fff;color:#140a26;border-radius:999px;
        padding:3.4mm 8mm;font-size:4.2mm;font-weight:800;
        box-shadow:0 3mm 8mm rgba(0,0,0,.35)}
  .flip b{color:#7c3aed}

  /* back */
  .b-head{margin-top:5mm;text-align:center}
  .b-h1{margin-top:2.6mm;font-size:10.6mm;font-weight:800;letter-spacing:-.02em;line-height:1.04}
  .b-sub{margin:4mm auto 0;max-width:110mm;font-size:4mm;line-height:1.5;color:#D9CFF2}
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
`;

const FRONT = `
  <div class="sheet">
    <div class="lockup"><img src="${LOGO}"/><span class="site">aicareermentor.co.uk</span></div>
    <div class="f-head">
      <div class="kicker">New role &middot; First job &middot; Career change</div>
      <div class="f-h1">You rehearse it in your head.<br/><span class="dim">You still have no idea if you&rsquo;re any good.</span></div>
      <p class="f-sub">AI Career Mentor puts you in a real interview &mdash; questions read aloud, your spoken answers scored on content, delivery and presence, with a model answer to learn from. So when the real one comes, you&rsquo;ve already done it.</p>
    </div>
    <div class="shotwrap"><img src="${SHOT}"/></div>
    <div class="spacer"></div>
    <div class="flip">Flip over for <b>50% off</b> &rarr;</div>
    <div style="height:3mm"></div>
  </div>`;

const BACK = `
  <div class="sheet">
    <div class="lockup"><img src="${LOGO}"/><span class="site">aicareermentor.co.uk</span></div>
    <div class="b-head">
      <div class="kicker">Your next move</div>
      <div class="b-h1">New role? First job?<br/>Career change?</div>
      <p class="b-sub">Whatever you&rsquo;re aiming for, AI Career Mentor gets you ready to land it &mdash; from a sharper application to interview answers you&rsquo;ve actually tested out loud.</p>
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
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${FRONT}${BACK}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 3 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);
await page.pdf({
  path: `${OUT}/flyer-duplex.pdf`,
  width: "148mm",
  height: "210mm",
  printBackground: true,
});
// Side previews.
const sheets = page.locator(".sheet");
await sheets.nth(0).screenshot({ path: `${OUT}/flyer-duplex-front.png` });
await sheets.nth(1).screenshot({ path: `${OUT}/flyer-duplex-back.png` });
await browser.close();
console.log(`done → ${OUT}/flyer-duplex.pdf (2 pages)`);
