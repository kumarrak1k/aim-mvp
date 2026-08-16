// Pilot library — STAR structure explainer: how to build any answer.
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync("marketing/social/vo/pilot-durs.json", "utf8"))
  .durs["pilot-star"];
const dur = (id, floor) =>
  Math.max(floor, Math.ceil((0.22 + (D[id] ?? 0) + 0.28) * 10) / 10);

export const SCENES = [
  {
    id: "st-hook",
    kicker: null,
    caption: "Structure any answer in 30 seconds",
    vo: "Let's break it down.",
    video: "../footage-bank/B07-office-stairs-energy.mp4",
    dur: dur("st-hook", 3.0),
  },
  {
    id: "st-s",
    kicker: null,
    caption: "Situation &mdash; set the scene in one line.",
    vo: "Step one.",
    video: "../footage-bank/B01-practise-out-loud-desk.mp4",
    dur: dur("st-s", 3.4),
  },
  {
    id: "st-ta",
    kicker: null,
    caption: "Task &amp; Action &mdash; what you did, specifically.",
    vo: "Step two.",
    video: "../footage-bank/B05-mock-video-interview.mp4",
    dur: dur("st-ta", 3.4),
  },
  {
    id: "st-r",
    kicker: null,
    caption: "Result &mdash; end on a number.",
    vo: "Step three.",
    video: "../footage-bank/B15-checklist-ticks.mp4",
    dur: dur("st-r", 3.2),
  },
  {
    id: "st-star",
    kicker: null,
    caption: "Situation. Task. Action. Result.",
    vo: "Situation. Task. Action. Result.",
    video: "../footage-bank/B03-notes-prep-closeup.mp4",
    dur: dur("st-star", 3.4),
  },
  {
    id: "st-land",
    kicker: null,
    caption: "That&rsquo;s how you land it.",
    vo: "That's how you land it.",
    video: "../footage-bank/B12-warm-handshake.mp4",
    dur: dur("st-land", 2.6),
  },
  {
    id: "st-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Practise like it's real.",
    image: null,
    dur: dur("st-cta", 3.6),
  },
];

export const CTA = {
  headline: "Every answer, STAR-scored.",
  subline: "Practise out loud and see exactly where your structure holds — and where it slips.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "Structure any answer in 30 seconds",
  subline: "Situation, task, action, result — practise it out loud with honest scores.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
