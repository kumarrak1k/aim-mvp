/**
 * EVERY word and every timing in the social advert lives here.
 *
 * This is the only file you need to touch to reword the advert. Change a
 * string, then run one command:
 *
 *     npm run social
 *
 * That re-renders the slides, the static image and the MP4 together, so the
 * video and the static can never drift out of sync with each other.
 *
 * House style (see the brand guide): UK English, no em dashes, and never the
 * "AI-" prefix in English copy, since the product is called AI Career Mentor
 * and "AI-powered" therefore says it twice.
 */

/** Anything shown on the closing frame of the video. */
export const CTA = {
  headline: "Walk in already<br/>having done it.",
  subline: "Interview practice and mock assessment centres, scored honestly.",
  button: "Free to start. No card needed.",
  site: "aicareermentor.co.uk",
};

/** The standalone square image. Kept separate: a still has to carry the
 *  headline, the proof and the offer at once, where the video spreads those
 *  across six beats, so it wants slightly different words. */
export const STATIC = {
  headline: "Walk in already having done it.",
  subline:
    "Interview practice and mock assessment centres, scored the way an assessor scores them.",
  button: "Free to start. No card needed.",
  site: "aicareermentor.co.uk",
};

/**
 * The video beats, in order.
 *
 *  kicker   small label above the caption; null for none
 *  caption  the headline for that beat. Keep to six words or fewer: most of
 *           the feed is muted and scrolling, so it has to read in a glance
 *  image    a file in marketing/screenshots/. Ignored on the CTA beat
 *  proof    true swaps the whole app screenshot for a crop of the score panel,
 *           which stays legible at the width a feed actually renders
 *  dur      seconds to hold. Total runtime is the sum of these minus one
 *           crossfade (0.4s) per join, so six beats totalling 17.0 give 15.0s
 */
export const SCENES = [
  {
    id: "s1-hook",
    kicker: null,
    caption: "Interview prep shouldn’t be guesswork.",
    image: "candidate-04-summary.png",
    dur: 3.0,
  },
  {
    id: "s2-setup",
    kicker: "Practice",
    caption: "Built for your exact role.",
    image: "candidate-01-setup.png",
    dur: 2.7,
  },
  {
    id: "s3-question",
    kicker: "Answer",
    caption: "Type, speak, or go on camera.",
    image: "candidate-02-question.png",
    dur: 2.7,
  },
  {
    id: "s4-feedback",
    kicker: "Feedback",
    caption: "Every answer scored honestly.",
    image: "candidate-03-feedback.png",
    proof: true,
    dur: 3.0,
  },
  {
    id: "s5-ac",
    kicker: "Go deeper",
    caption: "Mock assessment centres too.",
    image: "ac-01-landing.png",
    dur: 2.6,
  },
  { id: "s6-cta", kicker: null, caption: null, image: null, dur: 3.0 },
];

/** Crossfade between beats, in seconds. */
export const TRANSITION = 0.4;
