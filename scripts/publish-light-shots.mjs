// Publish the light-theme outreach screenshots: resize the raw 3x captures in
// marketing/screenshots-light/ to 2000px-wide WebP in marketing/outreach/shots-light/.
// Deliberately does NOT touch public/marketing (the live site keeps its own set).
// Script-owned resize per the pipeline rule: never resize marketing shots by hand.
// Run: node scripts/publish-light-shots.mjs
import { readdirSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "marketing/screenshots-light";
const OUT = "marketing/outreach/shots-light";
// Print target: an image spanning the full A4 content width (~182mm) needs
// ~2150px at 300 DPI; 2600 gives ~360 DPI there and headroom everywhere else.
const WIDTH = 2600;

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => f.endsWith(".png"));
if (!files.length) {
  console.error(`no PNGs in ${SRC} — run the capture first`);
  process.exit(1);
}
const undersized = [];
for (const f of files) {
  const meta = await sharp(`${SRC}/${f}`).metadata();
  if (meta.width < WIDTH) undersized.push(`${f} (${meta.width}px)`);
  const out = `${OUT}/${f.replace(/\.png$/, ".webp")}`;
  const info = await sharp(`${SRC}/${f}`)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(out);
  console.log(`  ${f.padEnd(36)} ${meta.width}x${meta.height} -> ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
}
console.log(`done — ${files.length} shots published to ${OUT}/`);
if (undersized.length) {
  console.error(`\nFAIL: below the ${WIDTH}px publish width (would be soft):\n  ${undersized.join("\n  ")}`);
  process.exit(1);
}
