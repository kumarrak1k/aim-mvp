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
        "Premium AI interview coaching for answers, voice delivery and camera presence.",
      priority: 1,
    },
    {
      path: "/platform",
      label: "Platform",
      description:
        "Explore the AI interview coaching platform built for answer quality, delivery and readiness.",
      priority: 0.9,
    },
    {
      path: "/how-it-works",
      label: "How it works",
      description:
        "See how AI Career Mentor helps you configure, practise, review and improve your interview performance.",
      priority: 0.85,
    },
    {
      path: "/candidates",
      label: "Candidates",
      description:
        "Interview practice for graduates, career changers and experienced professionals.",
      priority: 0.8,
    },
    {
      path: "/pricing",
      label: "Pricing",
      description:
        "Simple pricing for AI interview coaching across answers, voice and camera presence.",
      priority: 0.8,
    },
    {
      path: "/practice",
      label: "Practice",
      description:
        "Start a tailored AI mock interview with answer feedback, voice coaching and camera presence analysis.",
      priority: 0.95,
    },
    {
      path: "/profile",
      label: "Candidate Profile",
      description:
        "Build your candidate profile once so every mock interview can be tailored to your goals.",
      priority: 0.7,
    },
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