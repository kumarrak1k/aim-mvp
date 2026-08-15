/**
 * Advert v3 — the TikTok cut, French (vous, matching the .com fr locale).
 * Same footage, story and look as v3tiktok; captions and narration in French
 * and the product screens taken from aim-mvp-com/marketing/screenshots/fr.
 *
 * Build:  IMG_SRC=../aim-mvp-com/marketing/screenshots/fr SOCIAL_COPY=v3tiktok-fr npm run social
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
  headline: "Entraînez-vous comme<br/>en vrai.",
  subline: "Entretiens, centres d’évaluation, tout y est.",
  button: "Commencez gratuitement",
  site: "aicareermentor.com",
};

export const STATIC = {
  headline: "Entraînez-vous comme en vrai.",
  subline: "Un entraînement réel aux entretiens, avec des scores honnêtes sur vos réponses, votre élocution et votre présence.",
  button: "Commencez gratuitement",
  site: "aicareermentor.com",
};

export const SCENES = [
  {
    id: "v3-1-hook",
    kicker: null,
    caption: "L’entretien se passe mal ?<br/>Vous connaissez ce sentiment.",
    vo: "Vous avez les compétences. Alors pourquoi vos entretiens ne le montrent pas ?",
    video: "T4-bad-interview-v1.mp4",
    dur: 4.7,
  },
  {
    id: "v3-2-problem",
    kicker: null,
    caption: "Savoir ne suffit pas.",
    vo: "Savoir ne suffit pas. Il faut savoir le transmettre.",
    video: "T6-aftermath-v1.mp4",
    dur: 3.6,
  },
  {
    id: "v3-3-practise",
    kicker: "Entraînez-vous",
    caption: "De vrais entretiens. À tout moment.",
    vo: "Entraînez-vous à de vrais entretiens, à tout moment.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 3.3,
  },
  {
    id: "v3-4-feedback",
    kicker: "Noté",
    caption: "Réponses. Élocution. Présence.",
    vo: "Des scores instantanés sur vos réponses, votre élocution et votre présence.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 4.9,
  },
  {
    id: "v3-5-model",
    kicker: "Apprenez",
    caption: "Découvrez une réponse plus forte.",
    vo: "Et une réponse modèle pour progresser.",
    image: "candidate-09-model-answer.png",
    dur: 2.7,
  },
  {
    id: "v3-6-improve",
    kicker: "Progressez",
    caption: "Entraînez-vous. Progressez. Recommencez.",
    vo: "Entraînez-vous. Progressez. Recommencez.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 2.6,
  },
  {
    id: "v3-7-ready",
    kicker: null,
    caption: "Puis entrez en confiance.",
    vo: "Puis entrez en confiance.",
    video: "T5-smiling-entrance-v1.mp4",
    dur: 2.6,
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Commencez gratuitement.",
    image: null,
    dur: 3.2,
  },
];

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
