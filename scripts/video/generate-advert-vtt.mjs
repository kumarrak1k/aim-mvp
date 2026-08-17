// Generate WebVTT caption tracks for the homepage advert cuts.
//
// Cue timing is derived from the same copy files the builder uses, so the
// captions cannot drift from the audio: beat i starts at
// sum(durs before i) - i * TRANSITION, and its narration begins VO_LEAD
// later. Each cue runs until the next beat starts.
//
// The frames already carry burned-in display captions; these tracks exist for
// caption-preference users and to make the narration text available as text,
// so the cue text is the SPOKEN line (vo), not the on-screen caption.
//
// Run: node scripts/video/generate-advert-vtt.mjs
import { writeFileSync } from "node:fs";

const ts = (s) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `00:${String(m).padStart(2, "0")}:${sec}`;
};

const buildVtt = async (variant, srcLang) => {
  const copy = await import(`./social-copy-${variant}.mjs`);
  const { SCENES, TRANSITION } = copy;
  const LEAD = copy.VO_LEAD ?? 0.35;
  const startOf = (i) =>
    SCENES.slice(0, i).reduce((n, s) => n + s.dur, 0) - i * TRANSITION;
  const total = SCENES.reduce((n, s) => n + s.dur, 0) - (SCENES.length - 1) * TRANSITION;

  let out = "WEBVTT\n\n";
  SCENES.forEach((s, i) => {
    if (!s.vo) return;
    const start = Math.max(0, startOf(i) + LEAD);
    const end = i + 1 < SCENES.length ? startOf(i + 1) : total;
    out += `${ts(start)} --> ${ts(end)}\n${s.vo}\n\n`;
  });
  return out;
};

const TARGETS = [
  ["v3tiktok", "C:/Users/rak1k/aim-mvp/public/videos/advert-square.en.vtt"],
  ["v3tiktok", "C:/Users/rak1k/aim-mvp-com/public/videos/advert-square.en.vtt"],
  ["v3tiktok-es", "C:/Users/rak1k/aim-mvp-com/public/videos/advert-square-es.es.vtt"],
  ["v3tiktok-fr", "C:/Users/rak1k/aim-mvp-com/public/videos/advert-square-fr.fr.vtt"],
  ["v3tiktok-de", "C:/Users/rak1k/aim-mvp-com/public/videos/advert-square-de.de.vtt"],
];

for (const [variant, path] of TARGETS) {
  writeFileSync(path, await buildVtt(variant));
  console.log("wrote", path);
}
