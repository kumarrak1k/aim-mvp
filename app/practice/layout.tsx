import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mock Interview Practice",
  description:
    "Run a tailored AI mock interview with answer scoring, voice delivery analysis, camera presence feedback, model answers and final readiness reporting.",
  alternates: {
    canonical: "https://www.aicareermentor.co.uk/practice",
  },
  openGraph: {
    title: "AI Mock Interview Practice | AI Career Mentor",
    description:
      "Practise interviews with AI coaching that scores your answers, voice delivery and camera presence.",
    url: "https://www.aicareermentor.co.uk/practice",
    siteName: "AI Career Mentor",
    images: [
      {
        url: "/brand/logo.jpg",
        width: 1200,
        height: 1200,
        alt: "AI Career Mentor logo",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Mock Interview Practice | AI Career Mentor",
    description:
      "Tailored mock interviews with answer, voice and camera feedback.",
    images: ["/brand/logo.jpg"],
  },
};

export default function PracticeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
