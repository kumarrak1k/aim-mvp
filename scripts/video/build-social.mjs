// Assemble the square social advert from the slides rendered by render-social.mjs.
//
// Deliberately silent: feed video autoplays muted, so the captions carry the
// message and there is no audio track to mix. Roughly 15 seconds end to end,
// which is about as long as a cold viewer will give a brand they don't know.
//
// Run: node scripts/video/build-social.mjs → marketing/social/advert-square-15s.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";

const BASE = "marketing/social";
const SLIDES = `${BASE}/slides`;
const SEGS = `${BASE}/segments`;
const OUT = `${BASE}/advert-square-15s.mp4`;
const SIZE = 1080;
const T = 0.4; // crossfade (s)
mkdirSync(SEGS, { recursive: true });

// Holds are tuned to reading time, not to an even split: the hook and the
// closing offer need longer than the middle beats, which restate a single idea
// the caption already carries. Sum minus the crossfades lands on ~15s.
const SCENES = [
  { id: "s1-hook", dur: 3.0 },
  { id: "s2-setup", dur: 2.7 },
  { id: "s3-question", dur: 2.7 },
  { id: "s4-feedback", dur: 3.0 },
  { id: "s5-ac", dur: 2.6 },
  { id: "s6-cta", dur: 3.0 },
].filter((s) => existsSync(`${SLIDES}/${s.id}.png`));

if (!SCENES.length) {
  console.error("No slides found. Run: node scripts/video/render-social.mjs");
  process.exit(1);
}

const ff = (args) => execFileSync(FFMPEG, args, { stdio: "ignore" });

// ── Per-scene clips with a slow Ken-Burns push ──────────────────────────────
// Direction alternates so consecutive beats don't feel like the same move, and
// the source is pre-scaled to 3x the output so zoompan interpolates from real
// pixels rather than resampling a 1080px frame.
SCENES.forEach((s, i) => {
  const frames = Math.round(s.dur * 30);
  const A = 0.05;
  const denom = Math.max(1, frames - 1);
  const z = i % 2 === 0 ? `1+${A}*on/${denom}` : `${(1 + A).toFixed(3)}-${A}*on/${denom}`;
  const vf =
    `scale=${SIZE * 3}:-2,zoompan=z='${z}':d=${frames}:` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${SIZE}x${SIZE}:fps=30,format=yuv420p`;
  ff(["-y", "-loop", "1", "-i", `${SLIDES}/${s.id}.png`, "-t", s.dur.toFixed(2), "-r", "30",
      "-vf", vf, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
      "-pix_fmt", "yuv420p", `${SEGS}/${s.id}.mp4`]);
  console.log("seg", s.id, s.dur.toFixed(1) + "s");
});

// ── Crossfade the clips together ────────────────────────────────────────────
const files = SCENES.map((s) => `${SEGS}/${s.id}.mp4`);
// Each crossfade overlaps two clips, so the finished runtime is the sum of the
// holds minus one transition per join.
const total = SCENES.reduce((n, s) => n + s.dur, 0) - (SCENES.length - 1) * T;
if (files.length === 1) {
  ff(["-y", "-i", files[0], "-c", "copy", OUT]);
} else {
  const inputs = [];
  files.forEach((f) => inputs.push("-i", f));
  let fc = "";
  let vlab = "[0:v]";
  let acc = SCENES[0].dur;
  for (let i = 1; i < files.length; i++) {
    fc += `${vlab}[${i}:v]xfade=transition=fade:duration=${T}:offset=${(acc - T).toFixed(3)}[v${i}];`;
    vlab = `[v${i}]`;
    acc = acc + SCENES[i].dur - T;
  }
  ff(["-y", ...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", vlab,
      // yuv420p + faststart: what LinkedIn, Instagram and X all want, and the
      // moov atom up front means it starts playing before the file has landed.
      "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", OUT]);
}
console.log(`done → ${OUT} (${total.toFixed(1)}s, ${SIZE}x${SIZE}, silent)`);
