// Rakesh-voiced variant of pilot-confidence — same captions/beats machinery,
// narration from the cloned Rakesh voice (takes in vo/pilot-confidence-rakesh).
// Pilot library — pure motivation cut on the campaign theme:
// energy and positive action getting results; confidence through practice.
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync("marketing/social/vo/pilot-durs.json", "utf8"))
  .durs["pilot-confidence-rakesh"];
const dur = (id, floor) =>
  Math.max(floor, Math.ceil((0.22 + (D[id] ?? 0) + 0.28) * 10) / 10);

export const SCENES = [
  {
    id: "c-hook",
    kicker: null,
    caption: "Confidence isn&rsquo;t luck.<br/>It&rsquo;s practice.",
    vo: "Confidence isn't luck. It's practice.",
    video: "../footage-bank/B04-morning-city-walk.mp4",
    dur: dur("c-hook", 3.2),
  },
  {
    id: "c-outloud",
    kicker: null,
    caption: "Practise it out loud.",
    vo: "Practise it out loud. That's the difference.",
    video: "../footage-bank/B01-practise-out-loud-desk.mp4",
    dur: dur("c-outloud", 3.2),
  },
  {
    id: "c-nerves",
    kicker: null,
    caption: "Preparation turns nerves into energy.",
    vo: "Preparation turns nerves into energy.",
    // B19-pregame-shakeout dropped on user feedback (the shoulder-loosening
    // read as an exercise move); stairs-energy matches "nerves into energy".
    video: "../footage-bank/B07-office-stairs-energy.mp4",
    dur: dur("c-nerves", 3.2),
  },
  {
    id: "c-walkin",
    kicker: null,
    caption: "Walk in prepared.",
    vo: "Walk in prepared. Walk out proud.",
    video: "../footage-bank/B09-door-breath-smile.mp4",
    dur: dur("c-walkin", 3.0),
  },
  {
    id: "c-ready",
    kicker: null,
    caption: "Ready when it matters.",
    vo: "Ready when it matters.",
    video: "../footage-bank/B13-victory-street-exit.mp4",
    dur: dur("c-ready", 2.8),
  },
  {
    id: "c-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "Start free today.",
    image: null,
    dur: dur("c-cta", 3.4),
  },
];

export const CTA = {
  headline: "Your next role starts with practice.",
  subline: "Real interview practice with honest scores — free to start.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "Confidence isn't luck. It's practice.",
  subline: "Real interview practice with honest scores — free to start.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
