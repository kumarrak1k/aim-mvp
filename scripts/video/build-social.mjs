// Assemble the social advert in every format, silent and voiced.
//
// The silent cut is the primary asset: feed video autoplays muted, so the
// burned-in captions carry the message. The voiced cut is written alongside it
// for the sound-on placements (Reels, Stories, TikTok, site, email).
//
// Run: node scripts/video/build-social.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
// Beat order and hold times come from the same file as the words, so the
// video, the static and the narration can never drift apart.
import { COPY, VARIANT } from "./social-which.mjs";
const { SCENES: COPY_SCENES, TRANSITION } = COPY;
import { FORMATS } from "./render-social.mjs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/i, "ffprobe.exe");

const BASE = "marketing/social";
// Everything is namespaced by variant so building v2 cannot overwrite v1.
const DIST = `${BASE}/final/${VARIANT}`;
const VO = `${BASE}/vo/${VARIANT}`;
const T = TRANSITION;

const ff = (args) => execFileSync(FFMPEG, args, { stdio: "ignore" });
const probe = (f) =>
  parseFloat(
    execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", f]).toString().trim()
  );

// Rebuilt from scratch each run so a renamed or removed beat cannot leave a
// stale file behind that looks like a current deliverable.
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const total = COPY_SCENES.reduce((n, s) => n + s.dur, 0) - (COPY_SCENES.length - 1) * T;
const voiced = COPY_SCENES.filter((s) => existsSync(`${VO}/${s.id}.mp3`));

/** Each beat's start on the finished timeline. Every crossfade overlaps two
 *  clips, so beat i begins one transition earlier for each join before it. */
const startOf = (i) => COPY_SCENES.slice(0, i).reduce((n, s) => n + s.dur, 0) - i * T;
/**
 * Voice pacing.
 *
 * The model reads fast: measured at over 300 words per minute on the longer
 * lines, against 140-160 for natural narration. `atempo` slows it without
 * touching pitch, which is cheaper and more controllable than regenerating.
 *
 * LEAD is the gap after a cut before the voice comes in, TAIL the silence
 * after the line before the next beat. Both matter: with the line butted up
 * against the cut on both sides it sounds like separate clips stitched
 * together rather than one person talking.
 */
const TEMPO = COPY.VO_TEMPO ?? 0.88;
const LEAD = COPY.VO_LEAD ?? 0.35;
const TAIL = COPY.VO_TAIL ?? 0.55;

for (const f of FORMATS) {
  const SLIDES = `${BASE}/slides/${VARIANT}/${f.name}`;
  const SEGS = `${BASE}/segments/${VARIANT}/${f.name}`;
  mkdirSync(SEGS, { recursive: true });

  const scenes = COPY_SCENES.filter((s) => existsSync(`${SLIDES}/${s.id}.png`));
  // A beat with no slide used to be dropped without a word, so renaming or
  // adding one in social-copy.mjs produced a short cut that still reported
  // success. Refuse to build instead.
  const absent = COPY_SCENES.filter((s) => !existsSync(`${SLIDES}/${s.id}.png`));
  if (absent.length) {
    console.error(
      `Missing ${f.name} slides for: ${absent.map((s) => s.id).join(", ")}\n` +
        `Run scripts/video/render-social.mjs first (or use \`npm run social\`).`
    );
    process.exit(1);
  }

  // ── Per-scene clips with a slow Ken-Burns push ────────────────────────────
  // Direction alternates so consecutive beats don't feel like the same move,
  // and the source is pre-scaled well above the output so zoompan interpolates
  // from real pixels rather than resampling the final frame.
  scenes.forEach((s, i) => {
    const frames = Math.round(s.dur * 30);

    // ── Filmed beat: real footage under the caption overlay ─────────────────
    // No Ken-Burns here. The footage already has its own camera move, and
    // adding a second one on top reads as a mistake.
    if (s.video) {
      const src = `${BASE}/footage/${s.video}`;
      if (!existsSync(src)) {
        console.error(`Missing footage: ${src}`);
        process.exit(1);
      }
      // Fill the frame and centre-crop. The clips are shot 9:16, so the square
      // format takes a centre slice rather than letterboxing.
      // The overlay is rendered at deviceScaleFactor 2, so it is twice the
      // frame size and has to be scaled down before compositing. Without this
      // ffmpeg pins it at 0,0 and you see the top-left quarter of the caption.
      // An optional `grade` filter runs before the overlay, so the caption is
      // never touched by a colour correction meant for the footage.
      // Stretch the clip if the beat outlasts it. Beat lengths are set by how
      // long the line takes to say, so a beat can end up slightly longer than
      // its four seconds of footage; without this the last frame freezes. The
      // ratios are a few percent, and on a slow camera move that is invisible.
      const shot = probe(src);
      const stretch = s.dur > shot ? `setpts=${(s.dur / shot).toFixed(4)}*PTS,` : "";

      const fc =
        `[0:v]${stretch}scale=${f.w}:${f.h}:force_original_aspect_ratio=increase,` +
        `crop=${f.w}:${f.h},fps=30,setsar=1${s.grade ? `,${s.grade}` : ""}[bg];` +
        `[1:v]scale=${f.w}:${f.h}[ov];` +
        `[bg][ov]overlay=0:0:format=auto,format=yuv420p[out]`;
      ff(["-y", "-i", src, "-loop", "1", "-i", `${SLIDES}/${s.id}.png`,
          "-filter_complex", fc, "-map", "[out]", "-t", s.dur.toFixed(2), "-r", "30",
          "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
          "-pix_fmt", "yuv420p", `${SEGS}/${s.id}.mp4`]);
      return;
    }

    // ── Still beat: slow Ken-Burns push ─────────────────────────────────────
    const A = 0.05;
    const denom = Math.max(1, frames - 1);
    const z = i % 2 === 0 ? `1+${A}*on/${denom}` : `${(1 + A).toFixed(3)}-${A}*on/${denom}`;
    const vf =
      `scale=${f.w * 3}:-2,zoompan=z='${z}':d=${frames}:` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${f.w}x${f.h}:fps=30,format=yuv420p`;
    ff(["-y", "-loop", "1", "-i", `${SLIDES}/${s.id}.png`, "-t", s.dur.toFixed(2), "-r", "30",
        "-vf", vf, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", `${SEGS}/${s.id}.mp4`]);
  });

  // ── Crossfade the clips together ──────────────────────────────────────────
  const files = scenes.map((s) => `${SEGS}/${s.id}.mp4`);
  const silent = `${DIST}/AI-Career-Mentor-${VARIANT}-${f.name}-${f.w}x${f.h}-silent.mp4`;
  if (files.length === 1) {
    ff(["-y", "-i", files[0], "-c", "copy", silent]);
  } else {
    const inputs = [];
    files.forEach((x) => inputs.push("-i", x));
    let fc = "";
    let vlab = "[0:v]";
    let acc = scenes[0].dur;
    for (let i = 1; i < files.length; i++) {
      fc += `${vlab}[${i}:v]xfade=transition=fade:duration=${T}:offset=${(acc - T).toFixed(3)}[v${i}];`;
      vlab = `[v${i}]`;
      acc = acc + scenes[i].dur - T;
    }
    ff(["-y", ...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", vlab,
        // yuv420p + faststart: what LinkedIn, Instagram and X all want, and the
        // moov atom up front means it starts playing before the file has landed.
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", silent]);
  }
  console.log(`  ${silent.split("/").pop()}  ${total.toFixed(1)}s`);

  // ── Optional voiced cut ───────────────────────────────────────────────────
  if (voiced.length) {
    const inputs = [];
    const parts = [];
    const labels = [];
    voiced.forEach((s, n) => {
      const i = COPY_SCENES.indexOf(s);
      const at = Math.max(0, startOf(i) + LEAD);
      const spoken = probe(`${VO}/${s.id}.mp3`) / TEMPO; // as heard, after slowing
      const room = s.dur - LEAD - TAIL;
      if (spoken > room && f === FORMATS[0]) {
        console.warn(
          `  warn: "${s.id}" runs ${spoken.toFixed(2)}s but the beat allows ${room.toFixed(2)}s ` +
            `(${s.dur}s minus ${LEAD}s lead and ${TAIL}s tail). Raise its \`dur\` to ` +
            `${(spoken + LEAD + TAIL).toFixed(1)} in social-copy.mjs.`
        );
      }
      inputs.push("-i", `${VO}/${s.id}.mp3`);
      parts.push(
        `[${n}:a]aresample=48000,atempo=${TEMPO},adelay=${Math.round(at * 1000)}:all=1[a${n}];`
      );
      labels.push(`[a${n}]`);
    });

    const fc =
      parts.join("") +
      `${labels.join("")}amix=inputs=${voiced.length}:normalize=0:dropout_transition=0,` +
      // asetpts is required, not cosmetic: with atempo in the chain, apad emits
      // a NOPTS timestamp and the muxer rejects the stream outright with
      // "non monotonically increasing dts". Regenerating timestamps fixes it.
      `apad=whole_dur=${total.toFixed(3)},asetpts=N/SR/TB[a]`;

    const aud = `${BASE}/_vo-${VARIANT}-${f.name}.m4a`;
    const out = `${DIST}/AI-Career-Mentor-${VARIANT}-${f.name}-${f.w}x${f.h}-voiceover.mp4`;
    ff(["-y", ...inputs, "-filter_complex", fc, "-map", "[a]",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", aud]);
    ff(["-y", "-i", silent, "-i", aud, "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
        "-movflags", "+faststart", out]);
    console.log(`  ${out.split("/").pop()}  ${total.toFixed(1)}s`);
  }
}

if (!voiced.length) {
  console.log(`(no voiceover clips in ${VO}/ — run scripts/video/generate-social-vo.mjs for voiced cuts)`);
}
console.log(`\ndone → ${DIST}/`);
