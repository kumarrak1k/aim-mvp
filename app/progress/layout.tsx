import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Progress Dashboard",
  description:
    "Track your mock interview performance over time. Review saved sessions, scores, voice delivery trends and camera presence feedback from AI Career Mentor.",
  alternates: {
    canonical: "https://www.aicareermentor.co.uk/progress",
  },
  openGraph: {
    title: "Interview Progress Dashboard | AI Career Mentor",
    description:
      "Review your saved practice sessions, scores and coaching insights over time.",
    url: "https://www.aicareermentor.co.uk/progress",
    siteName: "AI Career Mentor",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Progress Dashboard | AI Career Mentor",
    description:
      "Track your interview readiness and review saved sessions over time.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProgressLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
