// Storyboard for the candidate demo video (mirrors marketing/SCRIPT.md).
// image = a framed shot in marketing/framed/. vo = narration for TTS. caption = on-screen.
export const CANDIDATE_SCENES = [
  {
    id: "c1-hook",
    image: "candidate-03-feedback.png",
    caption: "Interview prep shouldn't be guesswork.",
    vo: "Most interview prep is generic. You rehearse in a mirror, and you never really know if you're getting better.",
  },
  {
    id: "c2-setup",
    image: "candidate-01-setup.png",
    caption: "Tailored to your role — in seconds.",
    vo: "AI Career Mentor builds a mock interview around your exact role, level, and the skills you want to sharpen.",
  },
  {
    id: "c3-question",
    image: "candidate-02-question.png",
    caption: "Type, speak, or go on camera.",
    vo: "You answer realistic, role-specific questions — by typing, speaking out loud, or on camera.",
  },
  {
    id: "c4-feedback",
    image: "candidate-03-feedback.png",
    caption: "Instant, scored feedback.",
    vo: "And you get instant, structured feedback — scored on content, clarity, structure and confidence, with a stronger model answer every time.",
  },
  {
    id: "c5-progress",
    image: "candidate-05-progress.png",
    caption: "See yourself improve.",
    vo: "Every session is saved, so you can see — not just feel — that you're improving.",
  },
  {
    id: "c6-cta",
    image: "candidate-04-summary.png",
    caption: "Walk in interview-ready.",
    vo: "Walk into your next interview ready. Start practising free today, at AI Career Mentor.",
  },
];

// Corporate / employer story (mirrors marketing/SCRIPT.md, Video 2).
export const CORPORATE_SCENES = [
  {
    id: "b1-hook",
    image: "corporate-01-dashboard.png",
    caption: "Hire on evidence, not CVs.",
    vo: "Screening candidates fairly, at scale, is hard. A CV doesn't show how someone actually thinks or communicates.",
  },
  {
    id: "b2-ac",
    image: "ac-01-landing.png",
    caption: "A full assessment centre, scored automatically.",
    vo: "AI Career Mentor for teams runs a complete assessment centre — case study, competency interview and presentation — scored into one clear report.",
  },
  {
    id: "b3-scored",
    image: "candidate-03-feedback.png",
    caption: "Every candidate, scored on the same brief.",
    vo: "Every candidate is assessed against the same brief, with structured, consistent scoring — and no interviewer bias.",
  },
  {
    id: "b4-cta",
    image: "corporate-02-manage.png",
    caption: "Compare candidates. Decide with confidence.",
    vo: "Compare candidates on real performance, and make confident hiring decisions, faster. AI Career Mentor for Business.",
  },
];

/** Select the deck via the DECK env var ("corporate" → corporate, else candidate). */
export function getDeck() {
  const name = process.env.DECK === "corporate" ? "corporate" : "candidate";
  return { name, scenes: name === "corporate" ? CORPORATE_SCENES : CANDIDATE_SCENES };
}
