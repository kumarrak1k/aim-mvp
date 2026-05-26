import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { requireTosAcceptance } from "@/app/lib/legal";

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

export default async function PracticeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Block superadmin accounts from candidate areas using session claims
  // (JWT-based — no Clerk API call required, resilient to Clerk API 500s).
  try {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const role = (sessionClaims as { metadata?: { role?: string } } | null)
        ?.metadata?.role;
      if (role === "superadmin") {
        redirect("/admin");
      }
    }
  } catch {
    // Auth error — continue to render the page. The middleware edge guard
    // handles the superadmin redirect as a fallback.
  }

  await requireTosAcceptance("/practice");
  return children;
}
