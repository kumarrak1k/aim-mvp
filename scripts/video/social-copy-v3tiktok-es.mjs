/**
 * Advert v3 — the TikTok cut, Spanish (tú, matching the .com es locale).
 * Same footage, story and look as v3tiktok; captions and narration in Spanish
 * and the product screens taken from aim-mvp-com/marketing/screenshots/es.
 *
 * Build:  IMG_SRC=../aim-mvp-com/marketing/screenshots/es SOCIAL_COPY=v3tiktok-es npm run social
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
  headline: "Practica como<br/>si fuera real.",
  subline: "Entrevistas, centros de evaluación, todo.",
  button: "Empieza gratis",
  site: "aicareermentor.com",
};

export const STATIC = {
  headline: "Practica como si fuera real.",
  subline: "Práctica real de entrevistas con puntuaciones honestas de tus respuestas, tu comunicación y tu presencia.",
  button: "Empieza gratis",
  site: "aicareermentor.com",
};

export const SCENES = [
  {
    id: "v3-1-hook",
    kicker: null,
    caption: "¿La entrevista va mal?<br/>Conoces esa sensación.",
    vo: "Sabes lo que vales. ¿Por qué tus entrevistas no lo demuestran?",
    video: "T4-bad-interview-v1.mp4",
    dur: 4.7,
  },
  {
    id: "v3-2-problem",
    kicker: null,
    caption: "Saberlo no basta.",
    vo: "Saber no basta. Tienes que transmitirlo.",
    video: "T6-aftermath-v1.mp4",
    dur: 3.4,
  },
  {
    id: "v3-3-practise",
    kicker: "Practica",
    caption: "Entrevistas reales. Cuando quieras.",
    vo: "Practica entrevistas reales cuando quieras.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 3.8,
  },
  {
    id: "v3-4-feedback",
    kicker: "Puntuado",
    caption: "Respuestas. Comunicación. Presencia.",
    vo: "Puntuación instantánea de tus respuestas, tu comunicación y tu presencia.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 5.0,
  },
  {
    id: "v3-5-model",
    kicker: "Aprende",
    caption: "Mira una respuesta más fuerte.",
    vo: "Y una respuesta modelo de la que aprender.",
    image: "candidate-09-model-answer.png",
    dur: 2.9,
  },
  {
    id: "v3-6-improve",
    kicker: "Mejora",
    caption: "Practica. Mejora. Repite.",
    vo: "Practica. Mejora. Repite.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 2.6,
  },
  {
    id: "v3-7-ready",
    kicker: null,
    caption: "Y entra con confianza.",
    vo: "Y entra con confianza.",
    video: "T5-smiling-entrance-v1.mp4",
    dur: 2.6,
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Empieza gratis.",
    image: null,
    dur: 3.7,
  },
];

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
