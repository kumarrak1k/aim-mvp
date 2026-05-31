import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy and Data Transparency",
  description:
    "Learn how AI Career Mentor handles candidate profile context, microphone and camera permissions, interview practice data and user controls.",
  alternates: {
    canonical: "https://aicareermentor.co.uk/privacy",
  },
  openGraph: {
    title: "Privacy and Data Transparency | AI Career Mentor",
    description:
      "Plain-English privacy and data transparency information for AI Career Mentor users.",
    url: "https://aicareermentor.co.uk/privacy",
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
    title: "Privacy and Data Transparency | AI Career Mentor",
    description:
      "How AI Career Mentor explains profile context, microphone, camera and practice data controls.",
    images: ["/brand/logo.jpg"],
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
