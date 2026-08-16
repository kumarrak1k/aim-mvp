// Pilot library — Question of the Week #1: "Tell me about yourself."
// All-footage cut from the banked clips; VO from the banked evergreen lines.
// Beat lengths derive from the measured padded VO (vo/pilot-durs.json) with
// readability floors, so the audio can never outrun its beat.
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync("marketing/social/vo/pilot-durs.json", "utf8"))
  .durs["pilot-qotw1"];
const dur = (id, floor) =>
  Math.max(floor, Math.ceil((0.22 + (D[id] ?? 0) + 0.28) * 10) / 10);

export const SCENES = [
  {
    id: "q1-hook",
    kicker: null,
    caption: "Question of the week",
    vo: "Question of the week.",
    video: "../footage-bank/B09-door-breath-smile.mp4",
    dur: dur("q1-hook", 2.6),
  },
  {
    id: "q1-question",
    kicker: null,
    caption: "&ldquo;Tell me about yourself.&rdquo;",
    vo: "Could you answer this in an interview?",
    video: "../footage-bank/B11-confident-interview.mp4",
    dur: dur("q1-question", 4.2),
  },
  {
    id: "q1-pause",
    kicker: null,
    caption: "Pause. Say your answer out loud.",
    vo: "Pause here. Say your answer out loud.",
    video: "../footage-bank/B19-pregame-shakeout.mp4",
    dur: dur("q1-pause", 3.2),
  },
  {
    id: "q1-coach",
    kicker: null,
    caption: "Present &rarr; past &rarr; future.<br/>Two lines each.",
    vo: "Here's what a strong answer covers.",
    video: "../footage-bank/B05-mock-video-interview.mp4",
    dur: dur("q1-coach", 4.2),
  },
  {
    id: "q1-miss",
    kicker: null,
    caption: "Don&rsquo;t recite your CV &mdash; say why you fit this role.",
    vo: "Most answers miss this.",
    video: "../footage-bank/B03-notes-prep-closeup.mp4",
    dur: dur("q1-miss", 4.2),
  },
  {
    id: "q1-land",
    kicker: null,
    caption: "That&rsquo;s how you land it.",
    vo: "That's how you land it.",
    video: "../footage-bank/B12-warm-handshake.mp4",
    dur: dur("q1-land", 2.6),
  },
  {
    id: "q1-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "Try it yourself, free, at AI Career Mentor.",
    image: null,
    dur: dur("q1-cta", 3.6),
  },
];

export const CTA = {
  headline: "Practise like it's real.",
  subline: "Real interview practice with honest scores — and a model answer for every question.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "Could you answer this out loud?",
  subline: "Practise real interview questions and get honest scores on every answer.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
