// Pilot library — Pregunta de la semana (Spanish): "Háblame de ti."
// Site register: tú (see the localised advert copy files).
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync("marketing/social/vo/pilot-durs.json", "utf8"))
  .durs["pilot-qotw1-es"];
const dur = (id, floor) =>
  Math.max(floor, Math.ceil((0.22 + (D[id] ?? 0) + 0.28) * 10) / 10);

export const SCENES = [
  {
    id: "e-hook",
    kicker: null,
    caption: "Pregunta de la semana",
    vo: "Pregunta de la semana.",
    video: "../footage-bank/B09-door-breath-smile.mp4",
    dur: dur("e-hook", 2.8),
  },
  {
    id: "e-question",
    kicker: null,
    caption: "&laquo;H&aacute;blame de ti.&raquo;",
    // Silent beat: the question sits on screen while the viewer reads it.
    video: "../footage-bank/B11-confident-interview.mp4",
    dur: 4.0,
  },
  {
    id: "e-pause",
    kicker: null,
    caption: "Pausa. Di tu respuesta en voz alta.",
    vo: "Pausa aquí. Di tu respuesta en voz alta.",
    video: "../footage-bank/B19-pregame-shakeout.mp4",
    dur: dur("e-pause", 3.4),
  },
  {
    id: "e-model",
    kicker: null,
    caption: "Presente &rarr; pasado &rarr; futuro.<br/>Dos frases cada uno.",
    vo: "Esta es la respuesta modelo.",
    video: "../footage-bank/B05-mock-video-interview.mp4",
    dur: dur("e-model", 4.2),
  },
  {
    id: "e-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "Pruébalo gratis en AI Career Mentor.",
    image: null,
    dur: dur("e-cta", 3.6),
  },
];

export const CTA = {
  headline: "Practica como si fuera real.",
  subline: "Práctica de entrevistas real con puntuaciones honestas — empieza gratis.",
  button: "Empieza gratis",
  site: "aicareermentor.com",
};

export const STATIC = {
  headline: "¿Podrías responder esto en voz alta?",
  subline: "Practica preguntas reales de entrevista con puntuaciones honestas.",
  button: "Empieza gratis",
  site: "aicareermentor.com",
};

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
