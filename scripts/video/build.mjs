// Assemble the candidate demo video.
//  - Video: per-scene smooth Ken-Burns motion + crossfades (xfade).
//  - Audio: ONE continuous narration track (VO clips back-to-back at full volume
//    with a small natural breath between) — NO audio fades. The video dissolves
//    happen UNDER the voice, so narration never fades in/out per scene.
// Run: node scripts/video/build.mjs   →   marketing/video/candidate-demo.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { CANDIDATE_SCENES } from "./scenes.mjs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/i, "ffprobe.exe");

const SLIDES = "marketing/video/slides";
const AUDIO = "marketing/video/audio";
const SEGS = "marketing/video/segments";
const VID = "marketing/video/_video.mp4";
const AUD = "marketing/video/_audio.m4a";
const OUT = "marketing/video/candidate-demo.mp4";
const T = 0.5; // video crossfade (s)
const G = 0.35; // natural breath between narration lines (s)
mkdirSync(SEGS, { recursive: true });

const ff = (args) => execFileSync(FFMPEG, args, { stdio: "ignore" });
const audioFor = (id) => ["mp3", "wav", "m4a"].map((e) => `${AUDIO}/${id}.${e}`).find(existsSync) || null;
const probe = (f) => parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim());
const estimate = (vo) => Math.max(3.5, vo.trim().split(/\s+/).length / 2.6 + 1.0);

const scenes = CANDIDATE_SCENES.filter((s) => existsSync(`${SLIDES}/${s.id}.png`));
const haveAudio = scenes.length > 0 && scenes.every((s) => audioFor(s.id));

// ── Stage 1: per-scene VIDEO-ONLY clips with smooth Ken-Burns motion ──
// Each scene is held for its narration + a breath + a transition tail, so the
// crossfade lands while the next line is just starting (voice leads the dissolve).
const durs = [];
scenes.forEach((s, i) => {
  const v = haveAudio ? probe(audioFor(s.id)) : estimate(s.vo);
  const dur = v + G + T;
  durs.push(dur);
  const frames = Math.round(dur * 30);
  const A = 0.05;
  const denom = Math.max(1, frames - 1);
  const z = i % 2 === 0 ? `1+${A}*on/${denom}` : `${(1 + A).toFixed(3)}-${A}*on/${denom}`;
  const vf = `scale=5760:-2,zoompan=z='${z}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,format=yuv420p`;
  ff(["-y", "-loop", "1", "-i", `${SLIDES}/${s.id}.png`, "-t", dur.toFixed(2), "-r", "30", "-vf", vf, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", `${SEGS}/${s.id}.mp4`]);
  console.log("seg", s.id, dur.toFixed(1) + "s");
});

// ── Stage 2: crossfade the video clips (video only) ──
const n = scenes.length;
if (n === 1) {
  ff(["-y", "-i", `${SEGS}/${scenes[0].id}.mp4`, "-c", "copy", VID]);
} else {
  const inputs = [];
  scenes.forEach((s) => inputs.push("-i", `${SEGS}/${s.id}.mp4`));
  let fc = "";
  let vlab = "[0:v]";
  let acc = durs[0];
  for (let i = 1; i < n; i++) {
    fc += `${vlab}[${i}:v]xfade=transition=fade:duration=${T}:offset=${(acc - T).toFixed(3)}[v${i}];`;
    vlab = `[v${i}]`;
    acc = acc + durs[i] - T;
  }
  ff(["-y", ...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", vlab, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", VID]);
}

// ── Stage 3: continuous narration (no fades) + mux ──
if (haveAudio) {
  const inputs = [];
  scenes.forEach((s) => inputs.push("-i", audioFor(s.id)));
  let fc = "";
  const labs = [];
  scenes.forEach((s, i) => {
    fc += `[${i}:a]aresample=48000,apad=pad_dur=${G}[p${i}];`;
    labs.push(`[p${i}]`);
  });
  fc += `${labs.join("")}concat=n=${n}:v=0:a=1[a]`;
  ff(["-y", ...inputs, "-filter_complex", fc, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", AUD]);
  ff(["-y", "-i", VID, "-i", AUD, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", OUT]);
} else {
  ff(["-y", "-i", VID, "-c", "copy", OUT]);
}
console.log(`done → ${OUT} ${haveAudio ? "(continuous VO — no audio fades, video crossfades under it)" : "(silent draft)"}`);
