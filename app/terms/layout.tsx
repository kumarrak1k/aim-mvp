import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Responsible Use",
  description:
    "Read the responsible-use guidance and plain-English terms for using AI Career Mentor as an AI interview practice and coaching tool.",
  alternates: {
    canonical: "https://www.aicareermentor.co.uk/terms",
  },
  openGraph: {
    title: "Terms and Responsible Use | AI Career Mentor",
    description:
      "Plain-English terms and responsible-use guidance for AI Career Mentor users.",
    url: "https://www.aicareermentor.co.uk/terms",
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
    title: "Terms and Responsible Use | AI Career Mentor",
    description:
      "Responsible-use guidance for AI interview coaching, feedback and candidate preparation.",
    images: ["/brand/logo.jpg"],
  },
};

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
