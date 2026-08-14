/**
 * EVERY word and every timing in the social advert lives here.
 *
 * This is the only file you need to touch to reword the advert. Change a
 * string, then run one command:
 *
 *     npm run social       silent cut only
 *     npm run social:vo    regenerate the narration and build both cuts
 *
 * Both commands re-render the slides, the static image and the MP4 together,
 * so the video and the static can never drift out of sync.
 *
 * House style (see the brand guide): UK English, no em dashes, and never the
 * "AI-" prefix in English copy, since the product is called AI Career Mentor
 * and "AI-powered" therefore says it twice.
 */

/** Anything shown on the closing frame of the video. */
export const CTA = {
  headline: "Be ready,<br/>not just rehearsed.",
  subline: "Interview practice and mock assessment centres, scored honestly.",
  button: "Free to start. No card needed.",
  site: "aicareermentor.co.uk",
};

/** The standalone square image. Kept separate: a still has to carry the
 *  headline, the proof and the offer at once, where the video spreads those
 *  across six beats, so it wants slightly different words. */
export const STATIC = {
  headline: "Be ready, not just rehearsed.",
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
 *  vo       the spoken line. Written to ADD to the caption rather than read it
 *           aloud, so a sound-on viewer gets more than a muted one. Budget
 *           about seven words per three seconds; the builder warns if a line
 *           overruns its beat instead of letting it bleed into the next
 *  image    a file in marketing/screenshots/. Ignored on the CTA beat
 *  proof    true swaps the whole app screenshot for a crop of the score panel,
 *           which stays legible at the width a feed actually renders
 *  dur      seconds to hold. Total runtime is the sum of these minus one
 *           crossfade (0.4s) per join
 *
 * Order is deliberate: name the problem, show the two things that make the
 * practice real, widen to the assessment centre, then prove it is all scored,
 * then ask. The proof beat sits immediately before the CTA because that is
 * where it does the most work.
 */
export const SCENES = [
  {
    id: "s1-hook",
    kicker: null,
    caption: "Interview prep shouldn’t be guesswork.",
    vo: "You rehearse, and never know if it’s working.",
    image: "candidate-04-summary.png",
    dur: 3.2,
  },
  {
    id: "s2-setup",
    kicker: "Practice",
    caption: "The questions you’ll actually face.",
    vo: "Real questions for your exact role and level.",
    image: "candidate-01-setup.png",
    dur: 3.0,
  },
  {
    id: "s3-question",
    kicker: "Delivery",
    caption: "How you say it counts.",
    vo: "Answer typed, spoken, or on camera.",
    image: "candidate-02-question.png",
    dur: 2.7,
  },
  {
    id: "s4-ac",
    kicker: "Go further",
    caption: "The whole assessment centre.",
    vo: "Case study, interview and presentation, scored end to end.",
    image: "ac-01-landing.png",
    dur: 3.4,
  },
  {
    id: "s5-feedback",
    kicker: "Feedback",
    caption: "Every answer scored honestly.",
    vo: "Every answer scored, with a stronger example.",
    image: "candidate-03-feedback.png",
    proof: true,
    dur: 3.0,
  },
  {
    id: "s6-cta",
    kicker: null,
    caption: null,
    vo: "Free to start. No card needed.",
    image: null,
    dur: 3.0,
  },
];

/** Crossfade between beats, in seconds. */
export const TRANSITION = 0.4;
