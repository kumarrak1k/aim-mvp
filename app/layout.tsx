import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Career Mentor | Interview Intelligence Platform",
  description:
    "Premium AI-powered interview coaching with answer scoring, voice analysis, camera feedback, model answers and personalised practice insights.",
  applicationName: "AI Career Mentor",
  keywords: [
    "AI interview coach",
    "interview practice",
    "career mentor",
    "mock interview",
    "voice feedback",
    "video interview feedback",
    "graduate interview practice",
    "AI career coaching",
  ],
  authors: [{ name: "AI Career Mentor" }],
  creator: "AI Career Mentor",
  publisher: "AI Career Mentor",
  metadataBase: new URL("https://www.aicareermentor.co.uk"),
  openGraph: {
    title: "AI Career Mentor | Interview Intelligence Platform",
    description:
      "Practise interviews with AI coaching that scores your answers, voice delivery and camera presence.",
    url: "https://www.aicareermentor.co.uk",
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
    title: "AI Career Mentor | Interview Intelligence Platform",
    description:
      "Premium AI-powered interview coaching with answer, voice and video feedback.",
    images: ["/brand/logo.jpg"],
  },
  icons: {
    icon: "/brand/logo.jpg",
    shortcut: "/brand/logo.jpg",
    apple: "/brand/logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#07030d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}