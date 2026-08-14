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
 * and "AI-powered" therefore says it twice. Note "practise" is the verb and
 * "practice" the noun in UK English; the closing line is an imperative, so it
 * takes the s.
 */

/** Anything shown on the closing frame of the video. */
export const CTA = {
  headline: "Practise.<br/>Improve.<br/>Walk in ready.",
  subline: "From your application to the assessment centre.",
  button: "Free to start. No card needed.",
  site: "aicareermentor.co.uk",
};

/** The standalone square image. Kept separate: a still has to carry the
 *  headline, the proof and the offer at once, where the video spreads those
 *  across six beats, so it wants slightly different words. */
export const STATIC = {
  headline: "Practise. Improve. Walk in ready.",
  subline:
    "From your application to the assessment centre, with every answer scored the way an assessor scores it.",
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
 *  proof    "score" shows the marks and the six metric tiles; "answer" shows
 *           the stronger STAR example. Both are crops, because a whole app
 *           screenshot is unreadable at the width a feed actually renders
 *  dur      seconds to hold. Total runtime is the sum of these minus one
 *           crossfade (0.4s) per join
 *
 * The order tells the end-to-end journey rather than listing features: you
 * cannot practise for an interview you were never offered, so the Studio opens
 * it. The model answer gets the longest beat because it is the thing people
 * actually learn from, and it sits in the middle where attention is still
 * high. The assessment centre closes the capability story just before the ask.
 */
export const SCENES = [
  {
    id: "s1-hook",
    kicker: null,
    caption: "Interview prep shouldn’t be guesswork.",
    vo: "You rehearse, and never know if it’s working.",
    image: "candidate-04-summary.png",
    dur: 3.0,
  },
  {
    id: "s2-studio",
    kicker: "Get in the room",
    caption: "First, get the interview.",
    vo: "CV, cover letter and personal statement.",
    image: "candidate-07-studio.png",
    dur: 3.0,
  },
  {
    id: "s3-practice",
    kicker: "Practise",
    caption: "The questions you’ll actually face.",
    vo: "Real questions for your exact role.",
    image: "candidate-01-setup.png",
    dur: 2.9,
  },
  {
    id: "s4-answer",
    kicker: "Learn",
    caption: "See a stronger answer every time.",
    vo: "Scored honestly, with a stronger answer to learn from.",
    // Typeset rather than screenshotted. The model answer panel in the app is
    // small body text in a very wide strip: cropped into a square it lands at
    // roughly 6px on a phone, so a screenshot would hide the exact thing this
    // beat exists to show. These lines are lifted verbatim from a real scored
    // session, set in brand type at a size that survives the feed.
    quote: {
      label: "Stronger answer example",
      lines: [
        { tag: "A", text: "I redesigned the data pipeline and automated the validation checks." },
        { tag: "R", text: "Turnaround fell by 40% and the team adopted the approach." },
      ],
    },
    image: "candidate-03-feedback.png",
    dur: 3.4,
  },
  {
    id: "s5-ac",
    kicker: "Go further",
    caption: "Then the whole assessment centre.",
    vo: "Case study, interview and presentation, all scored.",
    image: "ac-01-landing.png",
    dur: 3.0,
  },
  {
    id: "s6-cta",
    kicker: null,
    caption: null,
    vo: "From application to assessment centre. Free to start.",
    image: null,
    dur: 3.0,
  },
];

/** Crossfade between beats, in seconds. */
export const TRANSITION = 0.4;
