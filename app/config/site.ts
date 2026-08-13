export type SiteRoute = {
  path: string;
  label: string;
  description: string;
  priority: number;
  /**
   * Reachable by direct link, but not advertised: kept out of the sitemap, the
   * primary navigation and search indexes.
   *
   * Used for the corporate and university offers while they move to their own
   * site. Nothing is deleted — the pages, the recruiter app under /company and
   * the emailed invite flows all keep working, so existing customers are
   * unaffected and the code is there to lift when the separate site is built.
   */
  hidden?: boolean;
};

export const siteConfig = {
  name: "AI Career Mentor",
  domain: "aicareermentor.co.uk",
  // Bare apex is the canonical origin: Vercel redirects www → apex (307), and
  // NEXT_PUBLIC_SITE_URL is the apex. Keep this the apex so every canonical/OG
  // tag, sitemap entry, Stripe return URL and email link points at the origin
  // Vercel actually serves (no extra hop, no www↔apex canonical split).
  url: "https://aicareermentor.co.uk",
  title: "AI Interview Practice Online: Answers, Voice & Camera Scored | AI Career Mentor",
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
        "AI interview practice, mock assessment centres and honest scored feedback — built for candidates preparing for real interviews.",
      priority: 1,
    },

    // ── Candidate-side marketing ─────────────────────────────────────
    // /for-candidates now 308s to / (single-audience consolidation). Kept out
    // of the sitemap so a redirecting URL is not advertised.
    {
      path: "/for-candidates",
      hidden: true,
      label: "For candidates",
      description:
        "AI interview practice and mock assessment centre coaching for candidates.",
      priority: 0.95,
    },
    {
      path: "/interview-practice",
      label: "Interview practice",
      description:
        "Tailored AI mock interview practice with answer scoring, voice and camera presence feedback.",
      priority: 0.9,
    },
    {
      path: "/mock-assessment-centre",
      label: "Assessment centre",
      description:
        "Mock assessment centre with case study, competency interview, and presentation simulation, scored across competencies.",
      priority: 0.9,
    },
    {
      path: "/pricing",
      label: "Candidate pricing",
      description:
        "Transparent candidate pricing for AI interview practice and assessment centre coaching.",
      priority: 0.8,
    },

    // ── Business / hiring team marketing ─────────────────────────────
    {
      path: "/for-business",
      /* Hidden from nav, sitemap and search while the corporate offer moves
         to its own site. The page still resolves — see docs/competitive. */
      hidden: true,
      label: "For hiring teams",
      description:
        "Run structured AI assessments at scale. Build templates, send invites, score candidates fairly.",
      priority: 0.95,
    },
    {
      path: "/for-business/assessment-platform",
      /* Hidden from nav, sitemap and search while the corporate offer moves
         to its own site. The page still resolves — see docs/competitive. */
      hidden: true,
      label: "Assessment platform",
      description:
        "How the AI assessment platform works: workspace, templates, invites, results dashboard.",
      priority: 0.9,
    },
    {
      path: "/for-business/pricing",
      /* Hidden from nav, sitemap and search while the corporate offer moves
         to its own site. The page still resolves — see docs/competitive. */
      hidden: true,
      label: "Business pricing",
      description:
        "Per-seat pricing for hiring teams plus custom enterprise pricing.",
      priority: 0.8,
    },

    // ── Free tools & content ─────────────────────────────────────────
    {
      path: "/tools/star-scorer",
      label: "Free STAR Answer Scorer",
      description:
        "Free AI STAR answer scorer. No sign-in required. Paste your answer and get instant feedback on Situation, Task, Action, and Result.",
      priority: 0.8,
    },
    {
      path: "/blog",
      label: "Interview Guides",
      description:
        "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation.",
      priority: 0.8,
    },
    {
      path: "/questions",
      label: "Interview Question Library",
      description:
        "Thousands of categorised interview questions by role, industry, and interview type, with model answers and scoring guidance.",
      priority: 0.8,
    },

    // ── Comparison pages ─────────────────────────────────────────────
    {
      path: "/compare",
      label: "Best AI interview practice tools 2026",
      description:
        "An honest editorial comparison of the best AI interview practice tools in 2026, covering feedback depth, voice and camera analysis, assessment centres, and price.",
      priority: 0.7,
    },
    {
      path: "/compare/interview-warmup",
      label: "AI Career Mentor vs Interview Warmup",
      description:
        "Compare AI Career Mentor and Google Interview Warmup across tailored questions, delivery coaching, and structured feedback.",
      priority: 0.65,
    },
    {
      path: "/compare/big-interview",
      label: "AI Career Mentor vs Big Interview",
      description:
        "Compare AI Career Mentor and Big Interview on real-time AI scoring, delivery analysis, and role-tailored practice.",
      priority: 0.65,
    },
    {
      path: "/compare/yoodli",
      label: "AI Career Mentor vs Yoodli",
      description:
        "Compare AI Career Mentor and Yoodli: interview-specific coaching versus general speech analytics.",
      priority: 0.65,
    },
    {
      path: "/compare/chatgpt",
      label: "AI Career Mentor vs ChatGPT",
      description:
        "Compare AI Career Mentor and ChatGPT for interview practice: structured scoring, voice and camera analysis versus free-form chat.",
      priority: 0.65,
    },
    {
      path: "/compare/linkedin-interview-prep",
      label: "AI Career Mentor vs LinkedIn Interview Prep",
      description:
        "Compare AI Career Mentor and LinkedIn Interview Prep on AI feedback depth, delivery coaching, and tailored questions.",
      priority: 0.65,
    },

    // ── Company pages ─────────────────────────────────────────────────
    {
      path: "/about",
      label: "About",
      description:
        "The mission and story behind AI Career Mentor, a UK-built AI coaching platform for candidates and hiring teams.",
      priority: 0.7,
    },
    {
      path: "/press",
      label: "Press",
      description:
        "Press kit, brand assets, key stats, and media contact for AI Career Mentor.",
      priority: 0.6,
    },
    {
      path: "/security",
      label: "Security",
      description:
        "How AI Career Mentor protects your data: encryption, access controls, subprocessors, and GDPR compliance.",
      priority: 0.6,
    },
    {
      path: "/universities",
      /* Hidden from nav, sitemap and search while the corporate offer moves
         to its own site. The page still resolves — see docs/competitive. */
      hidden: true,
      label: "Universities",
      description:
        "Campus licensing for universities and careers services. Give every student access to AI interview coaching.",
      priority: 0.75,
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
