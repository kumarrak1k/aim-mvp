// Render a premium branded TITLE CARD per deck → marketing/video/<deck>/intro.png
// Used both as the video's opening (fade-in intro in build.mjs) and as the poster
// shown before the user clicks play. Run with DECK=candidate|corporate.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { getDeck } from "./scenes.mjs";

const { name, intro } = getDeck();
const OUT = `marketing/video/${name}`;
mkdirSync(OUT, { recursive: true });
const logo = readFileSync("public/brand/logo.jpg").toString("base64");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1920px;height:1080px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .card{position:relative;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:radial-gradient(ellipse 70% 60% at 25% 18%,rgba(120,60,255,0.22),transparent),
               radial-gradient(ellipse 60% 50% at 78% 88%,rgba(232,80,180,0.16),transparent),
               linear-gradient(180deg,#0a0614 0%,#140a26 52%,#0c0816 100%)}
  .lockup{display:flex;align-items:center;gap:26px;margin-bottom:70px}
  .logobox{position:relative;height:118px;width:118px;border-radius:28px;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(120,60,255,.12));border:1px solid rgba(255,255,255,.18);
    box-shadow:0 22px 64px rgba(70,25,140,.5)}
  .logobox::before{content:"";position:absolute;inset:-10px;border-radius:36px;background:rgba(140,92,255,.22);filter:blur(26px);z-index:-1}
  .logoinner{height:90%;width:90%;border-radius:20px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .logoinner img{height:100%;width:100%;object-fit:contain;transform:scale(1.12)}
  .word{font-size:46px;font-weight:900;letter-spacing:-.04em;color:#fff;line-height:1.05}
  .word small{display:block;font-size:18px;font-weight:600;letter-spacing:.02em;color:rgba(216,196,255,.7);margin-top:9px}
  .title{max-width:1340px;text-align:center;font-size:88px;font-weight:900;letter-spacing:-.045em;line-height:1.04;
    background:linear-gradient(90deg,#ffffff 28%,#e9d5ff 58%,#a5f3fc);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .sub{margin-top:32px;max-width:1080px;text-align:center;font-size:33px;line-height:1.42;color:rgba(209,213,219,.92)}
  .play{margin-top:70px;display:flex;align-items:center;gap:20px}
  .playbtn{height:96px;width:96px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#e848b4,#22d3ee);
    display:flex;align-items:center;justify-content:center;box-shadow:0 20px 56px rgba(168,85,247,.55)}
  .playbtn svg{height:40px;width:40px;margin-left:7px;fill:#fff}
  .playlabel{font-size:25px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.82)}
</style></head><body>
  <div class="card">
    <div class="lockup">
      <div class="logobox"><div class="logoinner"><img src="data:image/jpeg;base64,${logo}"/></div></div>
      <div class="word">AI Career Mentor<small>Interview coaching platform</small></div>
    </div>
    <div class="title">${intro.title}</div>
    <div class="sub">${intro.subtitle}</div>
    <div class="play">
      <div class="playbtn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="playlabel">Watch the demo</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/intro.png` });
await browser.close();

// Web poster (shown before play) — same card, optimised JPG.
mkdirSync("public/videos", { recursive: true });
await sharp(`${OUT}/intro.png`).resize({ width: 1600 }).jpeg({ quality: 86 }).toFile(`public/videos/${name}-poster.jpg`);
console.log(`title card → ${OUT}/intro.png + public/videos/${name}-poster.jpg (${name})`);
