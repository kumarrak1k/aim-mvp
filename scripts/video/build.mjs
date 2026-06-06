// Assemble the candidate demo video: per-scene Ken-Burns motion + crossfades,
// with VO audio if present (else a timed silent draft).
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
const OUT = "marketing/video/candidate-demo.mp4";
const T = 0.6; // crossfade duration (s)
mkdirSync(SEGS, { recursive: true });

const audioFor = (id) => ["mp3", "wav", "m4a"].map((e) => `${AUDIO}/${id}.${e}`).find(existsSync) || null;
const probe = (f) => parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim());
const estimate = (vo) => Math.max(3.5, vo.trim().split(/\s+/).length / 2.6 + 1.0);

const scenes = CANDIDATE_SCENES.filter((s) => existsSync(`${SLIDES}/${s.id}.png`));
let haveAudio = false;

// ── Stage 1: per-scene clip with a slow Ken-Burns zoom (+ VO if present) ──
const durs = [];
scenes.forEach((s, i) => {
  const slide = `${SLIDES}/${s.id}.png`;
  const audio = audioFor(s.id);
  if (audio) haveAudio = true;
  const dur = audio ? probe(audio) + 0.6 : estimate(s.vo);
  durs.push(dur);
  const frames = Math.round(dur * 30);
  // Smooth Ken-Burns: LINEAR zoom (not an accumulating/clamped expression) over a
  // big pre-scaled canvas so the crop math is sub-pixel — eliminates zoompan shake.
  // Alternate gentle zoom in / out per scene for variety; centre-anchored.
  const A = 0.05; // total zoom (5%)
  const denom = Math.max(1, frames - 1);
  const z = i % 2 === 0 ? `1+${A}*on/${denom}` : `${(1 + A).toFixed(3)}-${A}*on/${denom}`;
  const vf = `scale=5760:-2,zoompan=z='${z}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,format=yuv420p`;
  const seg = `${SEGS}/${s.id}.mp4`;
  const args = ["-y", "-loop", "1", "-i", slide];
  if (audio) args.push("-i", audio);
  args.push("-t", dur.toFixed(2), "-r", "30", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p");
  if (audio) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-af", "apad", "-shortest");
  else args.push("-an");
  args.push(seg);
  execFileSync(FFMPEG, args, { stdio: "ignore" });
  console.log("seg", s.id, dur.toFixed(1) + "s", audio ? "(+VO)" : "(silent)");
});

// ── Stage 2: crossfade-chain the clips (xfade video + acrossfade audio) ──
const n = scenes.length;
if (n === 1) {
  execFileSync(FFMPEG, ["-y", "-i", `${SEGS}/${scenes[0].id}.mp4`, "-c", "copy", OUT], { stdio: "ignore" });
} else {
  const inputs = [];
  scenes.forEach((s) => inputs.push("-i", `${SEGS}/${s.id}.mp4`));
  let fc = "";
  let vlab = "[0:v]";
  let alab = haveAudio ? "[0:a]" : null;
  let acc = durs[0];
  for (let i = 1; i < n; i++) {
    const off = (acc - T).toFixed(3);
    fc += `${vlab}[${i}:v]xfade=transition=fade:duration=${T}:offset=${off}[v${i}];`;
    vlab = `[v${i}]`;
    if (haveAudio) {
      fc += `${alab}[${i}:a]acrossfade=d=${T}[a${i}];`;
      alab = `[a${i}]`;
    }
    acc = acc + durs[i] - T;
  }
  const args = ["-y", ...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", vlab];
  if (haveAudio) args.push("-map", alab, "-c:a", "aac", "-b:a", "192k");
  args.push("-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", OUT);
  execFileSync(FFMPEG, args, { stdio: "ignore" });
}
console.log(`done → ${OUT}  ${haveAudio ? "(VO + motion + crossfades)" : "(SILENT draft + motion + crossfades)"}`);
