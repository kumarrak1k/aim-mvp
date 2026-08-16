// Prepare voiceover for the pilot video library from the banked takes.
//
// For every line a pilot cut uses this script:
//   1. picks the better of the two banked takes by tail decay (seed_audio ends
//      files flush with the last phoneme — the take whose final 120ms RMS sits
//      further below the preceding 480ms is the one whose ending survived),
//   2. pads it with 0.5s of silence (apad) so the ending can never be clipped,
//   3. writes it as marketing/social/vo/<variant>/<sceneId>.mp3 for the
//      builder, and
//   4. records the padded duration in marketing/social/vo/pilot-durs.json so
//      the social-copy-pilot-*.mjs files can size their beats from it.
//
// Run: node scripts/video/prepare-pilot-vo.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/i, "ffprobe.exe");
const BANK = "marketing/social/vo/bank";
const VO_ROOT = "marketing/social/vo";

const probe = (f) =>
  parseFloat(
    execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", f]).toString().trim()
  );

/** Overall RMS (dB) of a window of the file, via astats (printed on stderr). */
const rmsDb = (file, from, to) => {
  const r = spawnSync(
    FFMPEG,
    ["-i", file, "-af",
     `atrim=start=${Math.max(0, from).toFixed(3)}:end=${to.toFixed(3)},astats=metadata=0`,
     "-f", "null", "-"],
    { encoding: "utf8" }
  );
  const m = [...(r.stderr ?? "").matchAll(/RMS level dB:\s*(-?[\d.]+)/g)];
  return m.length ? parseFloat(m[m.length - 1][1]) : NaN;
};

/** Choose the take whose ending decays hardest, per the banked-take rule. */
const pickTake = (slug) => {
  const t1 = `${BANK}/${slug}-take1.wav`;
  const t2 = `${BANK}/${slug}-take2.wav`;
  if (!existsSync(t2)) return t1;
  const decay = (f) => {
    const d = probe(f);
    const tail = rmsDb(f, d - 0.12, d);
    const before = rmsDb(f, d - 0.6, d - 0.12);
    return before - tail; // bigger = quieter ending = safer
  };
  return decay(t2) > decay(t1) ? t2 : t1;
};

// sceneId → bank slug, per pilot variant.
export const PILOTS = {
  "pilot-qotw1": {
    "q1-hook": "question-of-the-week",
    "q1-question": "could-you-answer-this",
    "q1-pause": "pause-say-it-out-loud",
    "q1-coach": "strong-answer-covers",
    "q1-miss": "most-answers-miss-this",
    "q1-land": "thats-how-you-land-it",
    "q1-cta": "try-it-free-cta",
  },
  "pilot-qotw2": {
    "q2-hook": "new-week-new-question",
    "q2-question": "could-you-answer-this",
    "q2-pause": "pause-say-it-out-loud",
    "q2-coach": "strong-answer-covers",
    "q2-miss": "most-answers-miss-this",
    "q2-score": "how-would-you-score",
    "q2-cta": "try-it-free-cta",
  },
  "pilot-star": {
    "st-hook": "lets-break-it-down",
    "st-s": "step-one",
    "st-ta": "step-two",
    "st-r": "step-three",
    "st-star": "star-structure",
    "st-land": "thats-how-you-land-it",
    "st-cta": "aicm-practise-like-its-real",
  },
  "pilot-confidence": {
    "c-hook": "confidence-isnt-luck",
    "c-outloud": "practise-out-loud-difference",
    "c-nerves": "preparation-nerves-energy",
    "c-walkin": "walk-in-prepared",
    "c-ready": "ready-when-it-matters",
    "c-cta": "start-free-today",
  },
  "pilot-qotw1-es": {
    "e-hook": "es-pregunta-de-la-semana",
    "e-pause": "es-pausa-di-tu-respuesta",
    "e-model": "es-respuesta-modelo",
    "e-cta": "es-pruebalo-gratis",
  },
};

const durs = {};
const chosen = {};
for (const [variant, map] of Object.entries(PILOTS)) {
  const dir = `${VO_ROOT}/${variant}`;
  mkdirSync(dir, { recursive: true });
  durs[variant] = {};
  for (const [sceneId, slug] of Object.entries(map)) {
    const src = (chosen[slug] ??= pickTake(slug));
    const dst = `${dir}/${sceneId}.mp3`;
    execFileSync(FFMPEG, ["-y", "-i", src, "-af", "apad=pad_dur=0.5",
      "-codec:a", "libmp3lame", "-q:a", "2", dst], { stdio: "ignore" });
    durs[variant][sceneId] = Math.round(probe(dst) * 100) / 100;
  }
  console.log(variant, JSON.stringify(durs[variant]));
}
writeFileSync(`${VO_ROOT}/pilot-durs.json`, JSON.stringify({ durs, chosen }, null, 2));
console.log(`\ntakes chosen:`);
for (const [slug, f] of Object.entries(chosen)) console.log(`  ${slug} → ${f.split("/").pop()}`);
