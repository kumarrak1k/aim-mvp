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
    // The opener is filmed, not a screenshot. Seven beats of dashboard gave the
    // advert nothing to feel; this is the only beat whose job is recognition
    // rather than proof.
    //
    // The line is deliberately a recognition, not a result. "I scored 4 and
    // then 8" would convert better and we cannot use it: nobody actually
    // scored that, and a generated actor delivering it is a fabricated
    // testimonial. This is true of everyone watching and needs no evidence.
    id: "s1-hook",
    kicker: null,
    caption: "You rehearse it in your head.<br/>You still have no idea if you’re any good.",
    vo: "You rehearse it in your head. You still have no idea if you’re any good.",
    video: "H1-night-before-v1.mp4",
    // The generation came back badly underexposed: fine on a calibrated
    // monitor, unreadable on a phone outdoors, which is where this gets
    // watched. The curve lifts shadows and midtones while leaving the
    // highlights alone, so it still reads as night rather than turning grey.
    grade: "curves=all='0/0.10 0.25/0.47 0.5/0.70 1/1',eq=saturation=1.10",
    dur: 4.3,
  },
  {
    id: "s2-studio",
    kicker: "Get in the room",
    caption: "First, get the interview.",
    vo: "CV, cover letter and personal statement.",
    image: "candidate-07-studio.png",
    dur: 3.3,
  },
  {
    id: "s3-practice",
    kicker: "Practise",
    caption: "The questions you’ll actually face.",
    vo: "Real questions for your exact role.",
    image: "candidate-01-setup.png",
    dur: 3.0,
  },
  {
    // Filmed. He is in profile and barely moving, so there is no lip sync to
    // give the generation away even though he is speaking.
    id: "s3b-outloud",
    kicker: null,
    caption: "Say it out loud.",
    vo: "Typed, spoken, or on camera.",
    video: "H2-doing-the-work-v1.mp4",
    dur: 2.7,
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
    dur: 3.7,
  },
  {
    id: "s5-ac",
    kicker: "Go further",
    caption: "Then the whole assessment centre.",
    vo: "Case study, interview and presentation, all scored.",
    image: "ac-01-landing.png",
    dur: 4.2,
  },
  {
    // Deliberately descriptive, not a promise. The chart shows a seeded demo
    // arc (4 → 5 → 8); captioning it with those numbers would turn a picture of
    // the product into a claim about typical results, which needs evidence
    // behind it under the CAP code and which we do not have yet. "See if you're
    // actually improving" claims the tracking, which is true, and lets the
    // chart do the emotional work on its own.
    id: "s6-progress",
    kicker: "Track",
    caption: "See if you’re actually improving.",
    vo: "Every session tracked, so progress is visible.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.3,
  },
  {
    // The payoff. Shot from behind on purpose: it reads as confidence without
    // needing a face, which is where these generations fall down. The warm
    // morning light is a deliberate break from the dark opener.
    id: "s6b-walkin",
    kicker: null,
    caption: "Then walk in and do it for real.",
    vo: "Then walk in and do it for real.",
    video: "H3-walking-in-v1.mp4",
    dur: 2.6,
  },
  {
    // `cta: true` selects the closing layout. The renderer used to match on the
    // id, so renaming this beat silently sent it down the screenshot path.
    id: "s7-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "From application to assessment centre. Free to start.",
    image: null,
    dur: 4.2,
  },
];

/** Crossfade between beats, in seconds. */
export const TRANSITION = 0.4;
