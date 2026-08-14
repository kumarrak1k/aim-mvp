// Render the square social advert: six 1080x1080 slides, plus a standalone
// static image using the same layout and headline.
//
// Separate from render-slides.mjs on purpose. That one is 1920x1080, full-bleed
// and paced by a voiceover track; a feed advert is square, watched muted, and
// has to land its point in about 15 seconds, so the composition and the timing
// are different problems.
//
// Run: node scripts/video/render-social.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";
// Every word and timing lives in social-copy.mjs. Edit that file, not this one.
import { SCENES, CTA, STATIC } from "./social-copy.mjs";

const SRC = "marketing/screenshots";        // raw 4320x2700 captures
const OUT = "marketing/social";
const SIZE = 1080;
mkdirSync(`${OUT}/slides`, { recursive: true });

const b64 = (p) => readFileSync(p).toString("base64");
const LOGO = "data:image/svg+xml;base64," + b64("public/brand/logo-lockup.svg");

/**
 * A whole app screenshot is unreadable at the ~550px a LinkedIn feed actually
 * renders. So the beats that have to *prove* something use a crop instead: the
 * score, the six metric tiles and the start of the strengths panel, which stay
 * legible at feed size. Fractions are of the full-page capture's height.
 */
const cropOf = async (file, topFrac, heightFrac, widthFrac = 1) => {
  const src = `${SRC}/${file}`;
  const m = await sharp(src).metadata();
  const buf = await sharp(src)
    .extract({
      left: 0,
      top: Math.round(m.height * topFrac),
      width: Math.round(m.width * widthFrac),
      height: Math.round(m.height * heightFrac),
    })
    .png()
    .toBuffer();
  return buf.toString("base64");
};

// Two crops from the same full-page capture, because the advert has two
// different things to prove.
//
//   score   the 8/10 and the six metric tiles: proof that it is marked, not
//           just commented on
//   answer  the "Stronger answer example (STAR)" panel: the model answer, which
//           is the thing people actually learn from, so it has to be legible
//           rather than described
//
// Full width is safe now that the capture hides the support-chat launcher
// (tests/e2e/capture/hideChrome.ts); it used to overlap the last score tile.
const FULL = `candidate-03-feedback-full.png`;
const hasFull = existsSync(`${SRC}/${FULL}`);
const PROOF = {
  score: hasFull ? await cropOf(FULL, 0.415, 0.3) : null,
  answer: hasFull ? await cropOf(FULL, 0.71, 0.228) : null,
};

/**
 * Readiness trend chart, with the right edge shaved.
 *
 * The app draws a "TARGET" label just past the chart's viewBox, so the element
 * capture cuts it mid-word and it reads as a rendering fault. Trimming 2.5% off
 * the right removes the fragment and still clears the final data point.
 */
const TREND_FILE = "candidate-08-trend.png";
const CHART = existsSync(`${SRC}/${TREND_FILE}`)
  ? await (async () => {
      const m = await sharp(`${SRC}/${TREND_FILE}`).metadata();
      const buf = await sharp(`${SRC}/${TREND_FILE}`)
        .extract({ left: 0, top: 0, width: Math.round(m.width * 0.975), height: m.height })
        .png()
        .toBuffer();
      return buf.toString("base64");
    })()
  : null;

const SITE_BG = `
  radial-gradient(900px 620px at 22% -10%, rgba(168,85,247,.34), transparent 62%),
  radial-gradient(760px 560px at 88% 108%, rgba(232,80,180,.20), transparent 62%),
  linear-gradient(160deg,#150a2b 0%,#0a0614 55%,#070310 100%)`;

const head = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${SIZE}px;height:${SIZE}px;overflow:hidden}
  body{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
       background:${SITE_BG};color:#F8F4FF;
       display:flex;flex-direction:column;align-items:center;
       padding:66px 64px 58px;position:relative}
  .kicker{font-size:23px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
          color:#CD9CFA;margin-bottom:18px}
  .cap{font-size:66px;font-weight:800;letter-spacing:-.035em;line-height:1.07;
       text-align:center;max-width:900px;text-wrap:balance}
  .card{margin-top:auto;margin-bottom:auto;width:942px;border-radius:22px;overflow:hidden;
        border:1px solid rgba(255,255,255,.12);
        box-shadow:0 46px 110px -24px rgba(0,0,0,.8),0 0 0 1px rgba(168,85,247,.12)}
  .card img{display:block;width:942px;height:auto}
  .foot{display:flex;align-items:center;gap:16px;opacity:.92}
  .foot img{height:40px;width:auto;display:block}
  .foot .url{font-size:24px;font-weight:700;color:#CFC6E6;letter-spacing:.01em}`;

/** Card body: either a screenshot (or crop of one) or a typeset quote. */
const cardBody = (s) => {
  // The trend chart is captured as a bare SVG with a transparent ground, so it
  // needs its own dark panel rather than sitting straight on the gradient.
  if (s.chart) {
    return `<div class="chartwrap"><img src="data:image/png;base64,${CHART}"/></div>`;
  }
  if (s.quote) {
    return `<div class="quote">
      <div class="qlabel">${s.quote.label}</div>
      ${s.quote.lines
        .map(
          (l) => `<div class="qrow"><span class="qtag">${l.tag}</span><span class="qtext">${l.text}</span></div>`
        )
        .join("")}
    </div>`;
  }
  return `<img src="data:image/png;base64,${
    (s.proof && PROOF[s.proof]) || b64(`${SRC}/${s.image}`)
  }"/>`;
};

const contentSlide = (s) => `<!doctype html><html><head><meta charset="utf-8"><style>${head}
  /* Typeset model answer. Sized so it is still readable once the feed scales
     the square down to phone width, which a screenshot of the same panel is
     not. Colours are the app's own STAR chips. */
  .quote{width:942px;padding:52px 56px;background:rgba(255,255,255,.035)}
  .qlabel{font-size:23px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
          color:#5EE9C0;margin-bottom:30px}
  .qrow{display:flex;gap:22px;align-items:flex-start;margin-bottom:26px}
  .qrow:last-child{margin-bottom:0}
  .qtag{flex:none;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;
        justify-content:center;font-size:25px;font-weight:800;color:#0a0614;
        background:linear-gradient(140deg,#CD9CFA,#A855F7)}
  .qtext{font-size:32px;font-weight:600;line-height:1.4;color:#F8F4FF;padding-top:6px}
  /* Readiness trend: the captured SVG is transparent, so give it a panel of
     its own and breathing room. The right padding is wider because the chart's
     "TARGET" label sits hard against its own right edge. */
  .chartwrap{width:942px;padding:44px 62px 34px 44px;background:rgba(255,255,255,.04)}
  .chartwrap img{display:block;width:100%;height:auto}
</style></head>
<body>
  ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : `<div style="height:41px"></div>`}
  <div class="cap">${s.caption}</div>
  <div class="card">${cardBody(s)}</div>
  <div class="foot"><img src="${LOGO}"/><span class="url">${CTA.site}</span></div>
</body></html>`;

// Closing frame: the only place the offer is stated, so it gets the whole canvas.
const ctaSlide = () => `<!doctype html><html><head><meta charset="utf-8"><style>${head}
  body{justify-content:center;gap:0;padding:80px}
  .lock{height:132px;width:auto;display:block;margin-bottom:52px}
  .line{font-size:62px;font-weight:800;letter-spacing:-.03em;line-height:1.1;text-align:center;max-width:860px}
  .sub{margin-top:26px;font-size:31px;font-weight:500;line-height:1.45;color:#B9AEDA;text-align:center;max-width:760px}
  .pill{margin-top:46px;font-size:30px;font-weight:800;color:#0a0614;
        background:linear-gradient(96deg,#CD9CFA,#A855F7);padding:22px 52px;border-radius:999px}
  .site{margin-top:34px;font-size:27px;font-weight:700;color:#CFC6E6}
</style></head>
<body>
  <img class="lock" src="${LOGO}"/>
  <div class="line">${CTA.headline}</div>
  <div class="sub">${CTA.subline}</div>
  <div class="pill">${CTA.button}</div>
  <div class="site">${CTA.site}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  // 2x so the Ken-Burns push-in has real pixels to eat into rather than
  // resampling a 1080px source.
  deviceScaleFactor: 2,
});

for (const s of SCENES) {
  if (s.image && !existsSync(`${SRC}/${s.image}`)) {
    console.log("skip (missing screenshot)", s.image);
    continue;
  }
  await page.setContent(s.cta ? ctaSlide() : contentSlide(s), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${OUT}/slides/${s.id}.png` });
  console.log("slide", s.id);
}

// The static advert is its own composition rather than a reused frame: a still
// has to carry the headline, the proof and the offer at once, where the video
// can spread those over six beats.
const staticAd = `<!doctype html><html><head><meta charset="utf-8"><style>${head}
  /* Centre the stack: laid out from the top it left a dead band along the
     bottom edge, which reads as a cropping mistake in a square feed slot. */
  body{padding:70px 64px 60px;justify-content:center}
  .cap{font-size:70px;max-width:920px}
  .sub{margin-top:22px;font-size:29px;font-weight:500;color:#B9AEDA;text-align:center;max-width:820px;line-height:1.42}
  .card{margin-top:44px;margin-bottom:40px;width:900px}
  .card img{width:900px}
  .pill{font-size:27px;font-weight:800;color:#0a0614;
        background:linear-gradient(96deg,#CD9CFA,#A855F7);padding:19px 44px;border-radius:999px;margin-bottom:26px}
</style></head>
<body>
  <div class="cap">${STATIC.headline}</div>
  <div class="sub">${STATIC.subline}</div>
  <div class="card"><img src="data:image/png;base64,${PROOF.score ?? b64(`${SRC}/candidate-03-feedback.png`)}"/></div>
  <div class="pill">${STATIC.button}</div>
  <div class="foot"><img src="${LOGO}"/><span class="url">${STATIC.site}</span></div>
</body></html>`;

await page.setContent(staticAd, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(180);
await page.screenshot({ path: `${OUT}/advert-static-1080.png` });
console.log("static advert → marketing/social/advert-static-1080.png");

await browser.close();
