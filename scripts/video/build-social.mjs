// Assemble the square social advert from the slides rendered by render-social.mjs.
//
// Deliberately silent: feed video autoplays muted, so the captions carry the
// message and there is no audio track to mix. Roughly 15 seconds end to end,
// which is about as long as a cold viewer will give a brand they don't know.
//
// Run: node scripts/video/build-social.mjs → marketing/social/advert-square-15s.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
// Beat order and hold times come from the same file as the words, so the video
// and the static can never drift apart.
import { SCENES as COPY_SCENES, TRANSITION } from "./social-copy.mjs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";

const BASE = "marketing/social";
const SLIDES = `${BASE}/slides`;
const SEGS = `${BASE}/segments`;
const OUT = `${BASE}/advert-square-15s.mp4`;
const OUT_VO = `${BASE}/advert-square-15s-voice.mp4`;
const SIZE = 1080;
const T = TRANSITION;
mkdirSync(SEGS, { recursive: true });

const SCENES = COPY_SCENES.filter((s) => existsSync(`${SLIDES}/${s.id}.png`));

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

// ── Optional voiced cut ─────────────────────────────────────────────────────
// The silent file above is always produced and stays the primary asset: feed
// video autoplays muted. If voiceover clips exist, a second file is written
// alongside it rather than replacing it, so you can post the silent cut to the
// feed and keep the voiced one for sound-on placements.
const VO = `${BASE}/vo`;
const voiced = SCENES.filter((s) => existsSync(`${VO}/${s.id}.mp3`));

if (voiced.length) {
  const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/i, "ffprobe.exe");
  const probe = (f) =>
    parseFloat(
      execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", f]).toString().trim()
    );

  // Each beat's start on the finished timeline. Every crossfade overlaps two
  // clips, so beat i begins one transition earlier for each join before it.
  const startOf = (i) => SCENES.slice(0, i).reduce((n, s) => n + s.dur, 0) - i * T;
  const LEAD = 0.25; // let the cut land before the voice comes in

  const inputs = [];
  const parts = [];
  const labels = [];
  voiced.forEach((s, n) => {
    const i = SCENES.indexOf(s);
    const at = Math.max(0, startOf(i) + LEAD);
    const spoken = probe(`${VO}/${s.id}.mp3`);
    const room = s.dur - LEAD;
    if (spoken > room + 0.35) {
      console.warn(
        `  warn: "${s.id}" voice is ${spoken.toFixed(1)}s but the beat gives ${room.toFixed(1)}s. ` +
          `Shorten its \`vo\` line or raise its \`dur\` in social-copy.mjs.`
      );
    }
    inputs.push("-i", `${VO}/${s.id}.mp3`);
    parts.push(`[${n}:a]aresample=48000,adelay=${Math.round(at * 1000)}:all=1[a${n}];`);
    labels.push(`[a${n}]`);
  });

  const fc =
    parts.join("") +
    `${labels.join("")}amix=inputs=${voiced.length}:normalize=0:dropout_transition=0,` +
    `apad=whole_dur=${total.toFixed(3)}[a]`;

  const AUD = `${BASE}/_vo.m4a`;
  ff(["-y", ...inputs, "-filter_complex", fc, "-map", "[a]",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", AUD]);
  ff(["-y", "-i", OUT, "-i", AUD, "-map", "0:v", "-map", "1:a",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
      "-movflags", "+faststart", OUT_VO]);
  console.log(`done → ${OUT_VO} (${total.toFixed(1)}s, ${SIZE}x${SIZE}, voiced)`);
} else {
  console.log(`(no voiceover clips in ${VO}/ — run scripts/video/generate-social-vo.mjs for a voiced cut)`);
}
