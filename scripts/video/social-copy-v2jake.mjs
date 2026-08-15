/**
 * Advert v2, Jake narration — identical to social-copy-v2.mjs except the beat
 * lengths, which follow Jake's slower read. Kept as its own file purely so both
 * voices can be built and compared without disturbing the shipped cut.
 *
 * Build it with:
 *     SOCIAL_COPY=v2 npm run social:vo
 *
 * v1 (social-copy.mjs) stays untouched and buildable alongside it.
 *
 * Two departures from the script as written, both deliberate:
 *
 * 1. There is no on-screen AI interviewer character. The product asks its
 *    questions through the interface and reads them aloud; inventing an avatar
 *    would be showing a product that does not exist.
 * 2. The live-transcript beat is the real answer editor rather than motion of
 *    the transcript filling in. The capture harness cannot currently drive the
 *    recorder (see tests/e2e/capture/advert.capture.ts), so rather than fake
 *    it, this uses the genuine screen. Swap in real screen-recorded footage
 *    when there is some and it becomes a filmed beat like any other.
 */

export const CTA = {
  headline: "Practise like<br/>it’s real.",
  subline: "Your next opportunity starts here.",
  button: "Start practising free",
  site: "aicareermentor.co.uk",
};

export const STATIC = {
  headline: "Practise like it’s real.",
  subline:
    "Realistic interview practice with instant feedback on your answers, your delivery and your presence.",
  button: "Start practising free",
  site: "aicareermentor.co.uk",
};

export const SCENES = [
  {
    // THE HOOK. Nervous, before. Same character as the closing beat.
    id: "v2-1-hook",
    kicker: null,
    caption: "Ever left an interview thinking…<br/>I could have done better?",
    vo: "You know you're capable. So why do interviews make you look like you're not?",
    video: "H4-nervous-before-v1.mp4",
    dur: 5.7,
  },
  {
    // THE PROBLEM. Rehearsing alone, late, getting nowhere.
    id: "v2-2-problem",
    kicker: null,
    caption: "Knowing the answer isn’t enough.",
    vo: "Knowing the answer isn't enough. You have to deliver it.",
    // Deliberately a different person, and visibly so. The original night shot
    // is another woman at a laptop, close enough to the character in beats 1
    // and 7 that it read as a continuity error rather than as someone else.
    video: "H2-doing-the-work-v1.mp4",
    dur: 4.3,
  },
  {
    // THE PRODUCT. The real interface asking a real question.
    id: "v2-3-practise",
    kicker: "Practise",
    caption: "Realistic interviews, on demand.",
    vo: "Practise realistic interviews.",
    image: "candidate-02-question.png",
    dur: 3.5,
  },
  {
    // THE FEEDBACK. Scored on answer, delivery and presence.
    id: "v2-4-feedback",
    kicker: "Feedback",
    caption: "Answers, delivery and presence.",
    vo: "Instant feedback on your answers, delivery and presence.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 4.8,
  },
  {
    // THE MODEL ANSWER. The thing people actually learn from.
    id: "v2-5-model",
    kicker: "Learn",
    caption: "And a stronger answer to learn from.",
    vo: "And a stronger answer to learn from.",
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
    // THE IMPROVEMENT. Descriptive caption, not a promise: the arc on the chart
    // is seeded demo data, and captioning it with those numbers would turn a
    // picture of the product into a claim about typical results.
    id: "v2-6-improve",
    kicker: "Track",
    caption: "Practise. Improve. Go again.",
    vo: "Practise. Improve. Go again.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.9,
  },
  {
    // THE TRANSFORMATION. Same person, composed.
    id: "v2-7-ready",
    kicker: null,
    caption: "Until you’re ready.",
    vo: "Until you're not just prepared. You're ready.",
    video: "H5-confident-after-v1.mp4",
    dur: 4.3,
  },
  {
    id: "v2-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Start practising free.",
    image: null,
    dur: 5.8,
  },
];

/**
 * No slowing needed: the Raina narration is generated with speech_rate -12, so
 * it already arrives at a natural pace. Stretching it again would drag.
 */
export const VO_TEMPO = 1;

/**
 * Tighter than the default. At 171 words per minute the read itself was not
 * slow; it was the 0.9s of silence wrapped around every line that made the cut
 * drag. Less air between beats fixes the feel without touching delivery.
 */
export const VO_LEAD = 0.3;
export const VO_TAIL = 0.4;

export const TRANSITION = 0.4;
