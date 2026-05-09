export type ComparisonFeature = {
  feature: string;
  aim: string | boolean;
  competitor: string | boolean;
};

export type CompetitorData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  features: ComparisonFeature[];
  aimStrengths: string[];
  competitorStrengths: string[];
  verdict: string;
  ctaLabel: string;
};

export const competitors: Record<string, CompetitorData> = {
  chatgpt: {
    slug: "chatgpt",
    name: "ChatGPT",
    tagline: "AI Career Mentor vs ChatGPT for interview prep",
    description:
      "ChatGPT can answer interview questions and give general feedback, but it has no role-specific scoring, no voice or camera analysis, no progress tracking, and no structured coaching loop. AI Career Mentor is purpose-built for interview preparation.",
    url: "https://chat.openai.com",
    features: [
      { feature: "Role-tailored interview questions", aim: true, competitor: "Generic only" },
      { feature: "Scored answer feedback (0–10)", aim: true, competitor: false },
      { feature: "STAR structure analysis", aim: true, competitor: false },
      { feature: "Voice delivery analysis", aim: true, competitor: false },
      { feature: "Camera presence feedback", aim: true, competitor: false },
      { feature: "Model answers per question", aim: true, competitor: "On request" },
      { feature: "7-day personalised improvement plan", aim: true, competitor: false },
      { feature: "Progress history across sessions", aim: true, competitor: false },
      { feature: "Mock assessment centre", aim: true, competitor: false },
      { feature: "Repeatable structured practice loop", aim: true, competitor: false },
      { feature: "UK GDPR-compliant data handling", aim: true, competitor: "US data" },
      { feature: "Pricing", aim: "Free + from £19/mo", competitor: "Free + $20/mo ChatGPT Plus" },
    ],
    aimStrengths: [
      "Structured scoring across 6 dimensions — not a chat conversation",
      "Voice and camera presence assessed automatically, not just answer text",
      "Questions tailored to your exact role, level, interview type and focus area",
      "7-day improvement plan and progress tracking after every session",
      "Repeatable practice loop with consistent, comparable scoring",
      "Built for interview prep — not a general-purpose tool you have to prompt carefully",
    ],
    competitorStrengths: [
      "Free and extremely flexible — can discuss any topic",
      "Useful for brainstorming example answers and getting informal feedback",
      "No account required for basic use",
      "Broad general knowledge across industries and roles",
    ],
    verdict:
      "ChatGPT is a useful supplement for exploring ideas and drafting answers, but it is not an interview coach. It has no consistent scoring rubric, no voice or camera analysis, no session history, and no structured practice loop. AI Career Mentor is built specifically to prepare you for the moment you sit across from a hiring manager.",
    ctaLabel: "Try AI Career Mentor free →",
  },
  "linkedin-interview-prep": {
    slug: "linkedin-interview-prep",
    name: "LinkedIn Interview Prep",
    tagline: "AI Career Mentor vs LinkedIn Interview Prep",
    description:
      "LinkedIn Interview Prep offers basic practice questions with AI feedback on recorded video answers. AI Career Mentor goes further — scoring answer content, voice delivery, and camera presence with a full coaching loop and improvement plan.",
    url: "https://www.linkedin.com/interview-prep/",
    features: [
      { feature: "Role-tailored questions (your exact spec)", aim: true, competitor: "Category-based" },
      { feature: "Answer quality scoring (0–10)", aim: true, competitor: "Basic tips only" },
      { feature: "STAR structure analysis", aim: true, competitor: false },
      { feature: "Voice delivery analysis", aim: true, competitor: "Basic" },
      { feature: "Camera presence / eye contact feedback", aim: true, competitor: "Basic" },
      { feature: "Model answers per question", aim: true, competitor: false },
      { feature: "7-day personalised improvement plan", aim: true, competitor: false },
      { feature: "Progress tracking across sessions", aim: true, competitor: false },
      { feature: "Mock assessment centre", aim: true, competitor: false },
      { feature: "Recruiter assessment platform", aim: true, competitor: false },
      { feature: "UK GDPR-compliant data handling", aim: true, competitor: "US data" },
      { feature: "Pricing", aim: "Free + from £19/mo", competitor: "Free (LinkedIn Premium required for some features)" },
    ],
    aimStrengths: [
      "Scores the substance of your answers — not just delivery confidence",
      "Questions tailored to your role, level and interview format — not generic category lists",
      "STAR structure scoring and model answers for every question",
      "7-day improvement plan after every session with specific targets",
      "Separate recruiter platform for company-issued assessments",
      "UK-hosted, GDPR-first",
    ],
    competitorStrengths: [
      "Integrated with your LinkedIn profile — no separate account needed",
      "Huge brand trust — most candidates already have a LinkedIn account",
      "Free for core features without a separate subscription",
      "Question bank drawn from real recruiter data",
    ],
    verdict:
      "LinkedIn Interview Prep is convenient for quick warm-up practice using your existing account. AI Career Mentor is for serious preparation — it scores answer quality and structure, analyses voice and camera presence, and gives you a targeted improvement plan after every session.",
    ctaLabel: "Try AI Career Mentor free →",
  },
  "interview-warmup": {
    slug: "interview-warmup",
    name: "Interview Warmup (Google)",
    tagline: "AI Career Mentor vs Interview Warmup",
    description:
      "Google's Interview Warmup is a free tool for basic interview practice. AI Career Mentor is a full coaching platform covering answer quality, voice delivery, and camera presence with a structured improvement plan.",
    url: "https://grow.google/certificates/interview-warmup/",
    features: [
      { feature: "Tailored questions (by role + level)", aim: true, competitor: false },
      { feature: "Answer quality scoring", aim: true, competitor: "Basic" },
      { feature: "Voice delivery analysis", aim: true, competitor: false },
      { feature: "Camera presence feedback", aim: true, competitor: false },
      { feature: "Model answers included", aim: true, competitor: false },
      { feature: "7-day improvement plan", aim: true, competitor: false },
      { feature: "Progress history across sessions", aim: true, competitor: false },
      { feature: "Mock assessment centre", aim: true, competitor: false },
      { feature: "Natural audio question delivery (TTS)", aim: true, competitor: false },
      { feature: "GDPR-compliant (UK/EU)", aim: true, competitor: "US data" },
      { feature: "Pricing", aim: "Free + paid plans", competitor: "Free" },
    ],
    aimStrengths: [
      "Fully tailored to your role, level and interview type — not generic questions",
      "Voice delivery and camera presence scored, not just answer text",
      "Model answers for every question to benchmark against",
      "Structured 7-day improvement plan after each session",
      "Progress saved and tracked across all sessions",
      "Mock assessment centre for graduate and professional roles",
    ],
    competitorStrengths: [
      "Completely free with no sign-up required",
      "Backed by Google — high brand recognition",
      "Good for first-time practice with no commitment",
    ],
    verdict:
      "Interview Warmup is a good free entry point for occasional practice. AI Career Mentor is built for candidates who are actively preparing for a specific role and need honest, specific coaching — not just a place to speak into a microphone.",
    ctaLabel: "Try AI Career Mentor free →",
  },
  "big-interview": {
    slug: "big-interview",
    name: "Big Interview",
    tagline: "AI Career Mentor vs Big Interview",
    description:
      "Big Interview is an established interview preparation platform with video practice and coaching curricula. AI Career Mentor focuses on AI-powered, real-time scoring of answers, voice, and camera presence with a shorter, more focused practice loop.",
    url: "https://biginterview.com",
    features: [
      { feature: "AI-tailored questions (your exact role)", aim: true, competitor: "Template-based" },
      { feature: "Real-time answer scoring", aim: true, competitor: true },
      { feature: "Voice delivery analysis", aim: true, competitor: "Basic" },
      { feature: "Camera presence / eye contact feedback", aim: true, competitor: false },
      { feature: "Model answers per question", aim: true, competitor: false },
      { feature: "7-day personalised improvement plan", aim: true, competitor: false },
      { feature: "Mock assessment centre", aim: true, competitor: false },
      { feature: "Coaching video curriculum", aim: false, competitor: true },
      { feature: "Resume and CV tools", aim: false, competitor: true },
      { feature: "GDPR-compliant (UK/EU)", aim: true, competitor: "US-based" },
      { feature: "Pricing", aim: "From £19/month", competitor: "From ~$39/month" },
    ],
    aimStrengths: [
      "Questions generated specifically for your role, level, and interview format",
      "Camera presence and eye contact scored — not just what you say",
      "Much shorter practice loop — designed for intensive daily practice",
      "Built and hosted in the UK — GDPR-first",
      "Mock assessment centre included for graduate roles",
    ],
    competitorStrengths: [
      "Extensive video coaching curriculum with human guidance",
      "Resume builder and job search tools bundled",
      "Established platform with large question library",
      "Better for learning interview theory from scratch",
    ],
    verdict:
      "Big Interview is strong for candidates who want structured learning with human coaching content. AI Career Mentor is better for candidates who want fast, high-repetition practice with specific feedback on every answer they give — not general advice.",
    ctaLabel: "Try AI Career Mentor free →",
  },
  yoodli: {
    slug: "yoodli",
    name: "Yoodli",
    tagline: "AI Career Mentor vs Yoodli",
    description:
      "Yoodli is an AI speech and communication coaching tool that focuses on delivery — filler words, pace, eye contact. AI Career Mentor covers delivery but also scores answer quality, structure, and provides model answers for interview-specific preparation.",
    url: "https://yoodli.ai",
    features: [
      { feature: "Interview-specific question tailoring", aim: true, competitor: "Limited" },
      { feature: "Answer quality and STAR structure scoring", aim: true, competitor: false },
      { feature: "Voice delivery analysis", aim: true, competitor: true },
      { feature: "Camera / eye contact feedback", aim: true, competitor: true },
      { feature: "Model answers per question", aim: true, competitor: false },
      { feature: "7-day personalised improvement plan", aim: true, competitor: false },
      { feature: "Filler word tracking", aim: true, competitor: true },
      { feature: "Pacing and confidence metrics", aim: true, competitor: true },
      { feature: "Mock assessment centre", aim: true, competitor: false },
      { feature: "GDPR-compliant (UK/EU)", aim: true, competitor: "US-based" },
      { feature: "Pricing", aim: "From £19/month", competitor: "Free + paid plans" },
    ],
    aimStrengths: [
      "Scores the substance of your answers — not just how you sound",
      "STAR structure analysis and model answers for every question",
      "Questions tailored to your specific role and interview type",
      "Mock assessment centre included",
      "Structured improvement plan targets your weakest dimensions",
    ],
    competitorStrengths: [
      "Deeper speech analytics (more granular delivery metrics)",
      "Good for presentations and pitches beyond just interviews",
      "Meeting and sales call coaching use cases",
      "Free tier available",
    ],
    verdict:
      "Yoodli excels at delivery coaching for general communication. AI Career Mentor is purpose-built for interview preparation — it scores both what you say and how you say it, generates tailored questions, and gives you a model answer to benchmark against.",
    ctaLabel: "Try AI Career Mentor free →",
  },
};

export function getCompetitor(slug: string): CompetitorData | null {
  return competitors[slug] ?? null;
}

export function getAllCompetitorSlugs(): string[] {
  return Object.keys(competitors);
}
