// Rakesh-voiced variant of pilot-qotw2 — same captions/beats machinery,
// narration from the cloned Rakesh voice (takes in vo/pilot-qotw2-rakesh).
// Pilot library — Question of the Week #2: "What's your biggest weakness?"
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync("marketing/social/vo/pilot-durs.json", "utf8"))
  .durs["pilot-qotw2-rakesh"];
const dur = (id, floor) =>
  Math.max(floor, Math.ceil((0.22 + (D[id] ?? 0) + 0.28) * 10) / 10);

export const SCENES = [
  {
    id: "q2-hook",
    kicker: null,
    caption: "New week. New question.",
    vo: "New week. New question.",
    video: "../footage-bank/B04-morning-city-walk.mp4",
    dur: dur("q2-hook", 2.8),
  },
  {
    id: "q2-question",
    kicker: null,
    caption: "&ldquo;What&rsquo;s your biggest weakness?&rdquo;",
    vo: "Could you answer this in an interview?",
    video: "../footage-bank/B11-confident-interview.mp4",
    dur: dur("q2-question", 4.2),
  },
  {
    id: "q2-pause",
    kicker: null,
    caption: "Pause. Say yours out loud.",
    vo: "Pause here. Say your answer out loud.",
    video: "../footage-bank/B01-practise-out-loud-desk.mp4",
    dur: dur("q2-pause", 3.2),
  },
  {
    id: "q2-coach",
    kicker: null,
    caption: "Pick a real one &mdash; then show the fix you&rsquo;ve built.",
    vo: "Here's what a strong answer covers.",
    video: "../footage-bank/B06-cv-highlighting.mp4",
    dur: dur("q2-coach", 4.2),
  },
  {
    id: "q2-miss",
    kicker: null,
    caption: "&ldquo;I&rsquo;m a perfectionist&rdquo; isn&rsquo;t honest &mdash; and they know it.",
    vo: "Most answers miss this.",
    video: "../footage-bank/B02-mirror-rehearsal.mp4",
    dur: dur("q2-miss", 4.4),
  },
  {
    id: "q2-score",
    kicker: null,
    caption: "How would you score?",
    vo: "How would you score?",
    video: "../footage-bank/B15-checklist-ticks.mp4",
    dur: dur("q2-score", 2.8),
  },
  {
    id: "q2-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "Try it yourself, free, at AI Career Mentor.",
    image: null,
    dur: dur("q2-cta", 3.6),
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
