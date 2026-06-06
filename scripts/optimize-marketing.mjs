// Optimize framed marketing PNGs → web WebP in public/marketing/. Run: node scripts/optimize-marketing.mjs
import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "node:fs";

const SRC = "marketing/framed";
const OUT = "public/marketing";
if (!existsSync(SRC)) { console.error("no marketing/framed — run the capture + compositor first"); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".png"));
for (const f of files) {
  const out = `${OUT}/${f.replace(/\.png$/, ".webp")}`;
  const info = await sharp(`${SRC}/${f}`)
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);
  console.log(`${out}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
console.log(`done — ${files.length} → ${OUT}`);
