// Assemble the candidate demo video from slides (+ VO audio if present).
// Run: node scripts/video/build.mjs   →   marketing/video/candidate-demo.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { CANDIDATE_SCENES } from "./scenes.mjs";

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:/Users/rak1k/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/i, "ffprobe.exe");

const SLIDES = "marketing/video/slides";
const AUDIO = "marketing/video/audio";
const SEGS = "marketing/video/segments";
const OUT = "marketing/video/candidate-demo.mp4";
mkdirSync(SEGS, { recursive: true });

const abs = (p) => process.cwd().replace(/\\/g, "/") + "/" + p;
const audioFor = (id) => ["mp3", "wav", "m4a"].map((e) => `${AUDIO}/${id}.${e}`).find(existsSync) || null;
const probe = (f) =>
  parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim());
const estimate = (vo) => Math.max(3, vo.trim().split(/\s+/).length / 2.6 + 1.1);

let haveAudio = false;
const segs = [];
for (const s of CANDIDATE_SCENES) {
  const slide = `${SLIDES}/${s.id}.png`;
  if (!existsSync(slide)) { console.log("skip (no slide)", s.id); continue; }
  const audio = audioFor(s.id);
  if (audio) haveAudio = true;
  const dur = audio ? probe(audio) + 0.7 : estimate(s.vo);
  const seg = `${SEGS}/${s.id}.mp4`;
  const args = ["-y", "-loop", "1", "-i", slide];
  if (audio) args.push("-i", audio);
  args.push("-t", dur.toFixed(2), "-r", "30", "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p");
  if (audio) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-af", "apad", "-shortest");
  else args.push("-an");
  args.push(seg);
  console.log("segment", s.id, dur.toFixed(1) + "s", audio ? "(+VO)" : "(silent)");
  execFileSync(FFMPEG, args, { stdio: "ignore" });
  segs.push(seg);
}

const listFile = `${SEGS}/list.txt`;
writeFileSync(listFile, segs.map((f) => `file '${abs(f)}'`).join("\n"));
execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", OUT], { stdio: "ignore" });
console.log(`done → ${OUT}  ${haveAudio ? "(with VO)" : "(SILENT draft — add a TTS key to generate voiceover)"}`);
