export type SiteRoute = {
  path: string;
  label: string;
  description: string;
  priority: number;
};

export const siteConfig = {
  name: "AI Career Mentor",
  domain: "aicareermentor.co.uk",
  url: "https://www.aicareermentor.co.uk",
  title: "AI Career Mentor | AI Interview Coach for Answers, Voice and Camera Presence",
  description:
    "Premium AI interview coaching for sharper answers, stronger voice delivery and more confident camera presence.",
  keywords: [
    "AI interview coach",
    "AI mock interview",
    "interview practice",
    "voice interview coaching",
    "camera interview coaching",
    "job interview preparation",
    "graduate interview practice",
    "career changer interview practice",
    "AI career coach",
  ],
  creator: "AI Career Mentor",
  routes: [
    {
      path: "/",
      label: "Home",
      description:
        "Two products in one — interview practice for candidates and an AI assessment platform for hiring teams.",
      priority: 1,
    },

    // ── Candidate-side marketing ─────────────────────────────────────
    {
      path: "/for-candidates",
      label: "For candidates",
      description:
        "AI interview practice and mock assessment centre coaching for candidates.",
      priority: 0.95,
    },
    {
      path: "/for-candidates/interview-practice",
      label: "Interview practice",
      description:
        "Tailored AI mock interview practice with answer scoring, voice and camera presence feedback.",
      priority: 0.9,
    },
    {
      path: "/for-candidates/assessment-centre",
      label: "Assessment centre",
      description:
        "Mock assessment centre — case study, competency interview, and presentation simulation, scored across competencies.",
      priority: 0.9,
    },
    {
      path: "/for-candidates/pricing",
      label: "Candidate pricing",
      description:
        "Transparent candidate pricing for AI interview practice and assessment centre coaching.",
      priority: 0.8,
    },

    // ── Business / hiring team marketing ─────────────────────────────
    {
      path: "/for-business",
      label: "For hiring teams",
      description:
        "Run structured AI assessments at scale. Build templates, send invites, score candidates fairly.",
      priority: 0.95,
    },
    {
      path: "/for-business/assessment-platform",
      label: "Assessment platform",
      description:
        "How the AI assessment platform works — workspace, templates, invites, results dashboard.",
      priority: 0.9,
    },
    {
      path: "/for-business/pricing",
      label: "Business pricing",
      description:
        "Per-seat pricing for hiring teams plus custom enterprise pricing.",
      priority: 0.8,
    },

    // ── Authed / app routes (low priority for SEO) ───────────────────
    {
      path: "/practice",
      label: "Practice",
      description:
        "Start a tailored AI mock interview with answer feedback, voice coaching and camera presence analysis.",
      priority: 0.7,
    },
    {
      path: "/profile",
      label: "Candidate Profile",
      description:
        "Build your candidate profile once so every mock interview can be tailored to your goals.",
      priority: 0.5,
    },

    // ── Legacy paths (308-redirect via next.config.ts; kept here so the
    //    old page files still compile until Session 2 cleanup) ─────────
    {
      path: "/platform",
      label: "Platform",
      description: "Legacy — redirects to /for-candidates/interview-practice",
      priority: 0.1,
    },
    {
      path: "/how-it-works",
      label: "How it works",
      description: "Legacy — redirects to /for-candidates/interview-practice",
      priority: 0.1,
    },
    {
      path: "/candidates",
      label: "Candidates",
      description: "Legacy — redirects to /for-candidates",
      priority: 0.1,
    },
    {
      path: "/pricing",
      label: "Pricing",
      description: "Legacy — see /for-candidates/pricing or /for-business/pricing",
      priority: 0.1,
    },
    {
      path: "/enterprise",
      label: "Enterprise",
      description: "Legacy — redirects to /for-business",
      priority: 0.1,
    },

    // ── Legal ────────────────────────────────────────────────────────
    {
      path: "/privacy",
      label: "Privacy",
      description:
        "Learn how AI Career Mentor handles profile context, interview practice data, microphone permissions and camera permissions.",
      priority: 0.35,
    },
    {
      path: "/terms",
      label: "Terms",
      description:
        "Review the terms for using AI Career Mentor as an interview preparation and coaching platform.",
      priority: 0.35,
    },
  ] satisfies SiteRoute[],
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalizedPath}`;
}