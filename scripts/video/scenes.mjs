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

// Corporate / employer story — follows the recruiter WORKFLOW (purpose →
// build template → invite → review results → drill into a candidate → decide).
export const CORPORATE_SCENES = [
  {
    id: "b1-hook",
    image: "corporate-01-dashboard.png",
    caption: "Hire on evidence, not CVs.",
    vo: "Screening candidates fairly, at scale, is hard — a CV doesn't show how someone actually thinks or communicates.",
  },
  {
    id: "b2-template",
    image: "corporate-template.png",
    caption: "Build a role template once.",
    vo: "So you build a role template once: choose an interview or a full assessment centre, set the competencies, and it's reusable for every candidate.",
  },
  {
    id: "b3-invite",
    image: "corporate-invite.png",
    caption: "Invite candidates with one link.",
    vo: "Invite candidates with a single link. Everyone gets exactly the same fair, structured assessment — no scheduling, no recruiter time spent.",
  },
  {
    id: "b4-results",
    image: "corporate-results.png",
    caption: "Every candidate — scored and ranked.",
    vo: "As they finish, results land in your dashboard — automatically scored, signalled and ranked, so your shortlist is obvious at a glance.",
  },
  {
    id: "b5-detail",
    image: "corporate-detail.png",
    caption: "Open a full AI scorecard.",
    vo: "Open any candidate for a full AI scorecard: overall score, hire signal, and a competency-by-competency breakdown.",
  },
  {
    id: "b6-cta",
    image: "corporate-detail-questions.png",
    caption: "Decide with confidence.",
    vo: "Right down to every answer, with voice and camera delivery. Hire on evidence, and decide with confidence. AI Career Mentor for Business.",
  },
];

/** Select the deck via the DECK env var ("corporate" → corporate, else candidate). */
export function getDeck() {
  const name = process.env.DECK === "corporate" ? "corporate" : "candidate";
  return { name, scenes: name === "corporate" ? CORPORATE_SCENES : CANDIDATE_SCENES };
}
