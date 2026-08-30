// Guards against UTF-8 mojibake sneaking into source. Windows tooling that
// reads/writes files through the ANSI codepage double-encodes non-ASCII
// characters (em dashes and emoji become a-circumflex/eth garbage) and
// PowerShell's Out-File adds a UTF-8 BOM — both shipped to production once
// (2026-08-17, five shells + auth/accept). This file skips itself: the
// detection patterns below ARE the sequences it hunts.
// Run: node scripts/check-encoding.mjs
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|md|mdx|json|css|vtt|html|txt)$/;
// â€¦ covers the cp1252 punctuation family; Ã+letter covers doubled accents;
// ðŸ/âœ/â† are doubled emoji, checks and arrows; Â precedes £ · ° and NBSP.
const MOJIBAKE = /â€|ðŸ|âœ|â†|â‚¬|Ã[©¼±¤¶¨ £«®¯³º]|Â[£·°±© ]|�/;

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => EXTENSIONS.test(f) && !f.endsWith("check-encoding.mjs"));

let bad = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (text.charCodeAt(0) === 0xfeff) {
    console.error(`${file}: UTF-8 BOM (Out-File artefact — strip it)`);
    bad++;
  }
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MOJIBAKE);
    if (m) {
      console.error(`${file}:${i + 1}: mojibake "${m[0]}" — file was re-saved through the ANSI codepage`);
      bad++;
      break; // one hit per file is enough to fail
    }
  }
}

if (bad) {
  console.error(`\n${bad} file(s) with encoding damage. Repair before committing.`);
  process.exit(1);
}
console.log(`Encoding check passed (${files.length} files).`);
