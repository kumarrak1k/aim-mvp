import type { Metadata } from "next";
import { requireTosAcceptance } from "@/app/lib/legal";

export const metadata: Metadata = {
  title: "Candidate Profile Builder",
  description:
    "Save your CV, target role specification and interview goals so AI Career Mentor can generate more personalised interview questions, feedback and practice plans.",
  alternates: {
    canonical: "https://www.aicareermentor.co.uk/profile",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Candidate Profile Builder | AI Career Mentor",
    description:
      "Build a personalised interview context from your CV, target role and goals.",
    url: "https://www.aicareermentor.co.uk/profile",
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
    title: "Candidate Profile Builder | AI Career Mentor",
    description:
      "Save your CV, role specification and goals for personalised AI interview practice.",
    images: ["/brand/logo.jpg"],
  },
};

export default async function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireTosAcceptance("/profile");
  return children;
}
