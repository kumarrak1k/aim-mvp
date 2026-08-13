/**
 * Print artwork: A5 flyer and a double-sided business card.
 *
 * Rendered through a headless browser at print geometry rather than drawn by
 * hand, so the type is the real Plus Jakarta Sans and the background is the
 * site's actual gradient. Both are produced as PDF (what a printer wants,
 * vector text, exact physical size) and as a 300dpi PNG for on-screen review.
 *
 * Bleed: 3mm on every edge, the UK trade standard. Anything that must not be
 * cut off is kept inside a further 5mm safety margin.
 */
import { chromium } from "@playwright/test";
import QRCode from "qrcode";
import fs from "node:fs";

const OUT = process.argv[2];
const LOGO = process.argv[3];

const b64 = (f) =>
  "data:image/svg+xml;base64," + fs.readFileSync(LOGO + "/" + f).toString("base64");
const LOCKUP = b64("lockup-compact.svg");
const MARK = b64("mark.svg");

const SITE_BG = `radial-gradient(ellipse 70% 60% at 25% 15%, rgba(120,60,255,0.14), transparent),
                 radial-gradient(ellipse 60% 50% at 75% 85%, rgba(232,80,180,0.08), transparent),
                 linear-gradient(180deg, #0a0614 0%, #100a1f 55%, #0c0816 100%)`;

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`;

const CONTACT = {
  name: "Rakesh Kumar",
  title: "Managing Director",
  email: "rakesh@aicareermentor.co.uk",
  phone: "07904 351555",
  site: "aicareermentor.co.uk",
  company: "AI Career Mentor Ltd · England & Wales · Company No. 17288119",
};

const qr = async (text, dark = "#F8F4FF", light = "#00000000") =>
  "data:image/svg+xml;base64," +
  Buffer.from(
    await QRCode.toString(text, { type: "svg", margin: 0, color: { dark, light } })
  ).toString("base64");

const page = (w, h, body) => `<!doctype html><html><head><style>
  ${FONT}
  @page { size: ${w}mm ${h}mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; width: ${w}mm; height: ${h}mm; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: ${SITE_BG};
         color: #F8F4FF; overflow: hidden; }
</style></head><body>${body}</body></html>`;

const run = async () => {
  const browser = await chromium.launch();

  // ── A5 flyer: 148x210 trim, 154x216 with bleed ──────────────────────────
  const flyerQR = await qr("https://aicareermentor.co.uk/?utm_source=flyer&utm_medium=print");
  const flyer = page(154, 216, `
    <div style="padding:14mm 12mm 10mm;height:100%;display:flex;flex-direction:column">
      <img src="${LOCKUP}" style="height:16mm;width:auto;display:block;margin-bottom:12mm">

      <h1 style="font-size:30pt;line-height:1.06;font-weight:800;letter-spacing:-0.02em;margin:0 0 6mm">
        Walk into the<br>interview already<br>having done it.
      </h1>

      <p style="font-size:11pt;line-height:1.55;color:#CFC6E6;margin:0 0 9mm;max-width:112mm">
        AI interview practice and full mock assessment centres, scored the way an
        assessor scores them. Built for UK graduates, apprentices and career changers.
      </p>

      <div style="display:flex;flex-direction:column;gap:4.5mm;margin-bottom:9mm">
        ${[
          ["Mock assessment centres", "Case study, competency interview and presentation, scored stage by stage."],
          ["Answers scored honestly", "Every answer rated against published bands, with a stronger model answer."],
          ["Voice and camera reviewed", "Delivery, pace and presence, not just what you said."],
          ["CV &amp; Application Studio", "CV, cover letter and personal statement built from your real experience."],
        ].map(([t, d]) => `
          <div style="display:flex;gap:4mm;align-items:flex-start">
            <div style="width:2mm;height:2mm;border-radius:50%;background:#A855F7;margin-top:2.2mm;flex:none"></div>
            <div>
              <div style="font-size:10.5pt;font-weight:700;margin-bottom:0.8mm">${t}</div>
              <div style="font-size:9pt;line-height:1.45;color:#A79BC4">${d}</div>
            </div>
          </div>`).join("")}
      </div>

      <div style="margin-top:auto;display:flex;align-items:center;gap:7mm;
                  border-top:0.4mm solid rgba(255,255,255,0.14);padding-top:7mm">
        <img src="${flyerQR}" style="width:26mm;height:26mm;flex:none">
        <div>
          <div style="font-size:13pt;font-weight:800;margin-bottom:1.5mm">Start free. No card needed.</div>
          <div style="font-size:11pt;font-weight:600;color:#CD9CFA">aicareermentor.co.uk</div>
          <div style="font-size:7.5pt;color:#8E82AC;margin-top:2mm">
            Three practice sessions free, plus a taste of the assessment centre and the Studio.
          </div>
        </div>
      </div>
    </div>`);

  // ── Business card: 85x55 trim, 91x61 with bleed ─────────────────────────
  const cardQR = await qr("https://aicareermentor.co.uk");
  const cardFront = page(91, 61, `
    <div style="padding:8mm 7mm;height:100%;display:flex;flex-direction:column;justify-content:space-between">
      <img src="${LOCKUP}" style="height:13mm;width:auto;display:block">
      <div>
        <div style="font-size:13pt;font-weight:800;letter-spacing:-0.01em;line-height:1.15">${CONTACT.name}</div>
        <div style="font-size:8.5pt;font-weight:600;color:#CD9CFA;letter-spacing:0.06em;
                    text-transform:uppercase;margin-top:1.2mm">${CONTACT.title}</div>
      </div>
    </div>`);

  const cardBack = page(91, 61, `
    <div style="padding:8mm 7mm;height:100%;display:flex;align-items:center;gap:6mm">
      <div style="flex:1;display:flex;flex-direction:column;gap:2.4mm">
        <div style="font-size:8.5pt;font-weight:600">${CONTACT.email}</div>
        <div style="font-size:8.5pt;font-weight:600">${CONTACT.phone}</div>
        <div style="font-size:8.5pt;font-weight:700;color:#CD9CFA">${CONTACT.site}</div>
        <div style="font-size:5.6pt;line-height:1.4;color:#8E82AC;margin-top:1.5mm">${CONTACT.company}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2mm;flex:none">
        <img src="${cardQR}" style="width:21mm;height:21mm">
        <img src="${MARK}" style="height:5mm;width:auto;opacity:0.85">
      </div>
    </div>`);

  const emit = async (html, w, h, name) => {
    const p = await browser.newPage();
    await p.setContent(html, { waitUntil: "networkidle" });
    await p.pdf({ path: `${OUT}/${name}.pdf`, width: `${w}mm`, height: `${h}mm`,
                  printBackground: true, pageRanges: "1" });
    // Preview: browsers map 1mm to 96dpi CSS pixels (3.7795px), so give the
    // viewport that and let deviceScaleFactor carry it to 300dpi. Rewriting
    // the page to px broke every internal mm/pt measurement.
    const cssPx = (mm) => Math.round(mm * 3.779528);
    const pv = await browser.newPage({
      viewport: { width: cssPx(w), height: cssPx(h) },
      deviceScaleFactor: 300 / 96,
    });
    await pv.setContent(html, { waitUntil: "networkidle" });
    await pv.screenshot({ path: `${OUT}/${name}-preview.png` });
    await p.close(); await pv.close();
    console.log(`  ${name}: ${w}x${h}mm with bleed`);
  };

  await emit(flyer, 154, 216, "flyer-A5");
  await emit(cardFront, 91, 61, "business-card-front");
  await emit(cardBack, 91, 61, "business-card-back");
  await browser.close();
};

run();
