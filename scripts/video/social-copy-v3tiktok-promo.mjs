/**
 * Advert v3 — the TikTok cut, SUMMER2026 promo close. Identical to
 * v3tiktok except the final beat carries the discount code (runs to 30 Sep
 * 2026 — retire this variant with the code). Same story and product screens as v2, retold at
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
  headline: "50% off.<br/>This summer.",
  subline: "Half price on your first payment — any plan. Ends 30 September.",
  button: "Code: SUMMER2026",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "50% off. This summer.",
  subline: "Half price on your first payment — any plan. Use code SUMMER2026 at checkout. Ends 30 September.",
  button: "Code: SUMMER2026",
  site: "aicareermentor.co.uk",
};

export const SCENES = [
  {
    // THE HOOK. Her video interview is going badly: fidgeting, tense,
    // listening to a question she can't land. Listening, not speaking — that
    // keeps the acting in her face and hands, where these models are good,
    // and away from lip sync, where they are not.
    id: "v3-1-hook",
    kicker: null,
    caption: "Interview going badly?<br/>You know the feeling.",
    vo: "You know you're good. So why don't interviews show it?",
    video: "T4-bad-interview-v1.mp4",
    dur: 4.0,
  },
  {
    // THE AFTERMATH. Identity-referenced: the SAME woman drops onto the edge
    // of the bed, still in the blazer. (The earlier T1 flop shot was a
    // different woman — visibly, per Rakesh — so every human beat in this cut
    // now comes from the one reference.)
    id: "v3-2-problem",
    kicker: null,
    caption: "Knowing it isn’t enough.",
    vo: "Knowing your stuff isn't enough. You've got to deliver it.",
    video: "T6-aftermath-v1.mp4",
    dur: 3.5,
  },
  {
    // THE PRODUCT. Real interface, real answer, real score.
    id: "v3-3-practise",
    kicker: "Practise",
    caption: "Real interviews. On tap.",
    vo: "Practise real interviews, any time.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 2.6,
  },
  {
    id: "v3-4-feedback",
    kicker: "Scored",
    caption: "Answers. Delivery. Presence.",
    vo: "Instant scores on your answers, delivery and presence.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 3.3,
  },
  {
    id: "v3-5-model",
    kicker: "Learn",
    caption: "See a stronger answer.",
    vo: "And a stronger answer to learn from.",
    image: "candidate-09-model-answer.png",
    dur: 2.7,
  },
  {
    id: "v3-6-improve",
    kicker: "Level up",
    caption: "Practise. Improve. Go again.",
    vo: "Practise. Improve. Go again.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.1,
  },
  {
    // THE PAYOFF. The same woman from the hook — identity-referenced — walks
    // into her next interview smiling. The whole advert is her arc: anxious on
    // a bad call, practises, walks in unafraid.
    id: "v3-7-ready",
    kicker: null,
    caption: "Then walk in ready.",
    vo: "Then walk in ready.",
    video: "T5-smiling-entrance-v1.mp4",
    dur: 2.6,
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Get fifty percent off with code Summer twenty twenty-six.",
    image: null,
    dur: 6.7,
  },
];

/** Narration is generated pre-paced (Jake, faster read); never stretch it. */
export const VO_TEMPO = 1;

/** Tighter than any other cut: TikTok punishes dead air. */
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;

/** Snappier cuts than the brand default 0.4s. */
export const TRANSITION = 0.25;
