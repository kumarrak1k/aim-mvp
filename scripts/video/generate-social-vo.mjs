// Generate the advert voiceover with Rakesh's cloned voice (ElevenLabs),
// one clip per beat, into marketing/social/vo/.
//
// The credentials are NOT stored in this repo. They live in the digital-human
// project, which is where the voice clone was set up, and are read from the
// environment at run time:
//
//   ELEVENLABS_API_KEY   scoped key (text_to_speech permission is enough;
//                        the digital-human key has no voices_read, which is
//                        fine because this never lists or edits voices)
//   ELEVENLABS_VOICE_ID  the cloned voice
//   ELEVENLABS_MODEL     optional, defaults to eleven_flash_v2_5
//
// Convenience: with no env set it falls back to reading ../digital-human/.env,
// so `npm run social:vo` works locally without exporting anything.
//
// Run: node scripts/video/generate-social-vo.mjs
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { COPY, VARIANT } from "./social-which.mjs";
const { SCENES } = COPY;

const OUT = `marketing/social/vo/${VARIANT}`;
const DH_ENV = "../digital-human/.env";

const fromEnvFile = (path) => {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
};

const file = fromEnvFile(DH_ENV);
const KEY = process.env.ELEVENLABS_API_KEY || file.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID || file.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || file.ELEVENLABS_MODEL || "eleven_flash_v2_5";

if (!KEY || !VOICE) {
  console.error(
    `No ElevenLabs credentials. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID,\n` +
      `or make sure ${DH_ENV} exists (that is where the voice clone lives).`
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const lines = SCENES.filter((s) => s.vo?.trim());
if (!lines.length) {
  console.error("No `vo` lines in social-copy.mjs — nothing to generate.");
  process.exit(1);
}

for (const s of lines) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text: s.vo,
      model_id: MODEL,
      // Higher stability than the conversational default: an advert read wants
      // to be even and calm, where a chat agent benefits from more variation.
      voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.1 },
    }),
  });
  if (!res.ok) {
    console.error(`  ${s.id}: TTS failed ${res.status} ${(await res.text()).slice(0, 160)}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${OUT}/${s.id}.mp3`, buf);
  console.log(`  ${s.id.padEnd(14)} ${String(s.vo).slice(0, 46).padEnd(48)} ${Math.round(buf.length / 1024)}KB`);
}

console.log(`\ndone — ${lines.length} clips → ${OUT}/`);
console.log("Now run: node scripts/video/build-social.mjs (it picks these up automatically)");
