/**
 * The four lockup/background combinations as individual 2000x2000 PNGs for
 * uploading to merch / print sites (each is the artwork centred on its solid
 * polo purple, generous margins). The transparent-artwork files remain
 * polo-lockup-colour.png / polo-lockup-white.png for sites that want the
 * artwork alone.
 *
 * Run: node scripts/print/polo-tiles.mjs
 */
import { readFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const OUT = "marketing/print/polo";
mkdirSync(OUT, { recursive: true });

const TILES = [
  ["aim-logo-colour-deep-purple", "polo-lockup-colour.png", "#3b2064"],
  ["aim-logo-colour-bright-purple", "polo-lockup-colour.png", "#5b21b6"],
  ["aim-logo-white-deep-purple", "polo-lockup-white.png", "#3b2064"],
  ["aim-logo-white-bright-purple", "polo-lockup-white.png", "#5b21b6"],
];

for (const [name, art, bg] of TILES) {
  const lockup = await sharp(`${OUT}/${art}`).resize({ width: 1400 }).toBuffer();
  await sharp({
    create: { width: 2000, height: 2000, channels: 4, background: bg },
  })
    .composite([{ input: lockup, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${name}.png`);
  console.log("built", name);
}
