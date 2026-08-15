/**
 * Advert v3 — the TikTok cut. Same story and product screens as v2, retold at
 * TikTok pace for a young audience: brighter ground, hotter accent, bigger
 * type, faster cuts, snappier lines, and new footage cast in its audience's
 * twenties in bright energetic settings.
 *
 * Build:  SOCIAL_COPY=v3tiktok npm run social  (narration below via Jake)
 *
 * The vertical output is the deliverable; the square builds too but TikTok
 * only wants 9:16.
 */

/** Brighter, hotter look than the brand default. Same palette family, more
 *  voltage: stronger violet and fuchsia radials on a lighter ground, fuchsia
 *  kicker, larger captions. */
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
    // THE HOOK. Young, bright, kinetic: she flops onto the bed after an
    // interview that got away from her. Everyone in the audience has been her.
    id: "v3-1-hook",
    kicker: null,
    caption: "Ever left an interview knowing<br/>you could’ve done better?",
    vo: "You know you're good. So why don't interviews show it?",
    video: "T1-flop-v1.mp4",
    dur: 3.0,
  },
  {
    // THE PROBLEM. Practising out loud, pacing, energy.
    id: "v3-2-problem",
    kicker: null,
    caption: "Knowing it isn’t enough.",
    vo: "Knowing your stuff isn't enough. You've got to deliver it.",
    video: "T2-pacing-v1.mp4",
    dur: 3.2,
  },
  {
    // THE PRODUCT. Real interface, real answer, real score.
    id: "v3-3-practise",
    kicker: "Practise",
    caption: "Real interviews. On tap.",
    vo: "Practise real interviews, any time.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 3.7,
  },
  {
    id: "v3-4-feedback",
    kicker: "Scored",
    caption: "Answers. Delivery. Presence.",
    vo: "Instant scores on your answers, delivery and presence.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 4.4,
  },
  {
    id: "v3-5-model",
    kicker: "Learn",
    caption: "See a stronger answer.",
    vo: "And a stronger answer to learn from.",
    image: "candidate-09-model-answer.png",
    dur: 3.0,
  },
  {
    id: "v3-6-improve",
    kicker: "Level up",
    caption: "Practise. Improve. Go again.",
    vo: "Practise. Improve. Go again.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.3,
  },
  {
    // THE PAYOFF. Taking the steps two at a time in morning sun.
    id: "v3-7-ready",
    kicker: null,
    caption: "Then walk in ready.",
    vo: "Then walk in ready.",
    video: "T3-steps-v1.mp4",
    dur: 2.6,
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Start free.",
    image: null,
    dur: 2.9,
  },
];

/** Narration is generated pre-paced (Jake, faster read); never stretch it. */
export const VO_TEMPO = 1;

/** Tighter than any other cut: TikTok punishes dead air. */
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;

/** Snappier cuts than the brand default 0.4s. */
export const TRANSITION = 0.25;
