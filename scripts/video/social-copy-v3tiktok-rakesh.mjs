/**
 * Advert v3 — the TikTok cut, narrated by Rakesh's cloned voice (Higgsfield
 * "Rakesh" element voice). Same story, captions and footage as v3tiktok;
 * only the narration and the beat holds differ. The user picked the takes:
 * approved reference = the hook (2.86s), everything else selected from
 * banked takes by pace + tail-decay (see marketing/social/vo-rakesh/raw).
 *
 * Beat holds are derived from the MEASURED voice lines
 * (VO_LEAD + speech + VO_TAIL, rounded up to 0.1s) so the video breathes
 * with this read instead of Jake's — do not copy durs back to v3tiktok.
 *
 * Build:  SOCIAL_COPY=v3tiktok-rakesh npm run social
 */

export const THEME = {
  bg: `
  radial-gradient(1000px 700px at 25% -10%, rgba(168,85,247,.55), transparent 62%),
  radial-gradient(820px 620px at 85% 110%, rgba(232,80,180,.42), transparent 62%),
  linear-gradient(160deg,#2b1655 0%,#1a0f33 55%,#140a26 100%)`,
  accent: "#F0ABFC",
  capBoost: 6,
};

export const CTA = {
  headline: "Practise like<br/>it’s real.",
  subline: "Interviews, assessment centres, the lot.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "Practise like it’s real.",
  subline: "Real interview practice with honest scores on your answers, delivery and presence.",
  button: "Start free",
  site: "aicareermentor.co.uk",
};

export const SCENES = [
  {
    id: "v3-1-hook",
    kicker: null,
    caption: "Interview going badly?<br/>You know the feeling.",
    vo: "You know you're good. So why don't interviews show it?",
    video: "T4-bad-interview-v1.mp4",
    dur: 3.6, // VO 2.86s
  },
  {
    id: "v3-2-problem",
    kicker: null,
    caption: "Knowing it isn’t enough.",
    vo: "Knowing your stuff isn't enough. You've got to deliver it.",
    video: "T6-aftermath-v1.mp4",
    dur: 4.4, // VO 3.70s
  },
  {
    id: "v3-3-practise",
    kicker: "Practise",
    caption: "Real interviews. On tap.",
    vo: "Practise real interviews, any time.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 3.2, // VO 2.40s
  },
  {
    id: "v3-4-feedback",
    kicker: "Scored",
    caption: "Answers. Delivery. Presence.",
    vo: "Instant scores on your answers, delivery and presence.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 4.3, // VO 3.53s
  },
  {
    id: "v3-5-model",
    kicker: "Learn",
    caption: "See a stronger answer.",
    vo: "And a stronger answer to learn from.",
    image: "candidate-09-model-answer.png",
    dur: 3.1, // VO 2.40s
  },
  {
    id: "v3-6-improve",
    kicker: "Level up",
    caption: "Practise. Improve. Go again.",
    vo: "Practise. Improve. Go again.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.4, // VO 2.66s
  },
  {
    id: "v3-7-ready",
    kicker: null,
    caption: "Then walk in ready.",
    vo: "Then walk in ready.",
    video: "T5-smiling-entrance-v1.mp4",
    dur: 2.2, // VO 1.33s — floor so the payoff shot lands
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Start free.",
    image: null,
    dur: 3.7, // VO 2.90s
  },
];

/** Narration is real takes selected for pace; never stretch it. */
export const VO_TEMPO = 1;

export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;

export const TRANSITION = 0.25;
