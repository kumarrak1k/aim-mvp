/**
 * Advert v3 — the TikTok cut, German (Sie, matching the .com de locale).
 * Same footage, story and look as v3tiktok; captions and narration in German
 * and the product screens taken from aim-mvp-com/marketing/screenshots/de.
 *
 * Build:  IMG_SRC=../aim-mvp-com/marketing/screenshots/de SOCIAL_COPY=v3tiktok-de npm run social
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
  headline: "Üben Sie, als<br/>wäre es echt.",
  subline: "Interviews, Assessment-Center, alles.",
  button: "Kostenlos starten",
  site: "aicareermentor.com",
};

export const STATIC = {
  headline: "Üben Sie, als wäre es echt.",
  subline: "Echtes Interviewtraining mit ehrlichen Bewertungen für Antworten, Auftreten und Präsenz.",
  button: "Kostenlos starten",
  site: "aicareermentor.com",
};

export const SCENES = [
  {
    id: "v3-1-hook",
    kicker: null,
    caption: "Läuft das Interview schlecht?<br/>Sie kennen das Gefühl.",
    vo: "Sie wissen, was Sie können. Warum zeigen es Ihre Interviews nicht?",
    video: "T4-bad-interview-v1.mp4",
    dur: 4.2,
  },
  {
    id: "v3-2-problem",
    kicker: null,
    caption: "Wissen allein reicht nicht.",
    vo: "Wissen allein reicht nicht. Sie müssen es auch rüberbringen.",
    video: "T6-aftermath-v1.mp4",
    dur: 4.1,
  },
  {
    id: "v3-3-practise",
    kicker: "Üben",
    caption: "Echte Interviews. Jederzeit.",
    vo: "Üben Sie echte Interviews, wann immer Sie wollen.",
    image: "candidate-03-feedback.png",
    framed: true,
    dur: 2.6,
  },
  {
    id: "v3-4-feedback",
    kicker: "Bewertet",
    caption: "Antworten. Auftreten. Präsenz.",
    vo: "Sofortige Bewertung von Antworten, Auftreten und Präsenz.",
    proof: "score",
    image: "candidate-03-feedback.png",
    dur: 3.9,
  },
  {
    id: "v3-5-model",
    kicker: "Lernen",
    caption: "Sehen Sie eine stärkere Antwort.",
    vo: "Und eine Musterantwort zum Lernen.",
    image: "candidate-09-model-answer.png",
    dur: 2.8,
  },
  {
    id: "v3-6-improve",
    kicker: "Steigern",
    caption: "Üben. Verbessern. Wiederholen.",
    vo: "Üben. Verbessern. Wiederholen.",
    image: "candidate-08-trend.png",
    chart: true,
    dur: 3.3,
  },
  {
    id: "v3-7-ready",
    kicker: null,
    caption: "Dann gehen Sie vorbereitet rein.",
    vo: "Dann gehen Sie vorbereitet rein.",
    video: "T5-smiling-entrance-v1.mp4",
    dur: 2.6,
  },
  {
    id: "v3-8-cta",
    cta: true,
    kicker: null,
    caption: null,
    vo: "AI Career Mentor. Starten Sie kostenlos.",
    image: null,
    dur: 3.6,
  },
];

export const VO_TEMPO = 1;
export const VO_LEAD = 0.22;
export const VO_TAIL = 0.28;
export const TRANSITION = 0.25;
