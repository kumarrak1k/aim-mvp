// Generate per-scene voiceover audio from the storyboard via a premium TTS.
// Prefers ElevenLabs (best, UK voices); falls back to OpenAI TTS. Needs a key:
//   ELEVENLABS_API_KEY  (+ optional ELEVENLABS_VOICE_ID)   — recommended
//   OPENAI_API_KEY      (+ optional OPENAI_TTS_VOICE)       — you already have one
// Run: npx dotenv-cli -e .env -- node scripts/video/generate-vo.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { CANDIDATE_SCENES } from "./scenes.mjs";

const OUT = "marketing/video/audio";
mkdirSync(OUT, { recursive: true });

const EL_KEY = process.env.ELEVENLABS_API_KEY;
const OAI_KEY = process.env.OPENAI_API_KEY;

async function tts(text) {
  if (EL_KEY) {
    const voice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb"; // "George" — British
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": EL_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (OAI_KEY) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${OAI_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "tts-1-hd", voice: process.env.OPENAI_TTS_VOICE || "fable", input: text, response_format: "mp3" }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("No TTS key — set ELEVENLABS_API_KEY or OPENAI_API_KEY (see scripts/video/README.md).");
}

const provider = EL_KEY ? "ElevenLabs" : OAI_KEY ? "OpenAI TTS" : null;
if (!provider) {
  console.error("No TTS key set. Add ELEVENLABS_API_KEY or OPENAI_API_KEY to .env — see scripts/video/README.md.");
  process.exit(1);
}
console.log("TTS provider:", provider);
for (const s of CANDIDATE_SCENES) {
  const buf = await tts(s.vo);
  writeFileSync(`${OUT}/${s.id}.mp3`, buf);
  console.log("vo", s.id, `${Math.round(buf.length / 1024)}KB`);
}
console.log(`done — ${CANDIDATE_SCENES.length} VO clips → ${OUT}. Now run: node scripts/video/build.mjs`);
