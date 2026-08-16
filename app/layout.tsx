import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { AttributionCapture } from "@/app/components/AttributionCapture";
import { ActivityTracker } from "@/app/components/ActivityTracker";
import { CookieConsent } from "@/app/components/marketing/CookieConsent";
import { DeferredMentorChat } from "@/app/components/marketing/DeferredMentorChat";
import "./globals.css";

/**
 * Self-hosted at build time by next/font, which matters twice over: the CSP
 * allows `font-src 'self'` only, and a render-blocking CDN request would cost
 * exactly the LCP the marketing pages are judged on.
 *
 * Plus Jakarta Sans reads as considered rather than default at the small label
 * sizes this UI leans on; the site previously fell through to Arial because
 * the theme referenced a --font-geist-sans that was never defined.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-loaded",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-loaded",
  weight: ["400", "500"],
});

const siteUrl = siteConfig.url;
const siteName = siteConfig.name;
const siteDescription =
  "Practise job interviews with AI coaching that scores your answers, voice delivery and camera presence, then gives model answers and practical improvement plans.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    ...siteConfig.keywords,
    "career mentor",
    "voice feedback",
    "video interview feedback",
    "camera presence coaching",
    "STAR interview answers",
    "interview confidence",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "Career coaching",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "AI Career Mentor | Practise Interviews with AI Coaching",
    description: siteDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Career Mentor · AI Interview Coaching",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Career Mentor | AI Interview Coach",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  // Favicons come from the file-based convention (app/icon.png and
  // app/apple-icon.png) — a clean, square, emblem-only crop of the brand
  // mark. The old manual entries pointed at /brand/logo.jpg, which is the
  // full lockup (emblem + "AI Career Mentor" text on white) and read as an
  // illegible white square at tab size.
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#07030d",
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      // Google needs a raster here (SVG is not accepted) and reads it for the
      // knowledge panel, so it must be the CURRENT mark, not the retired
      // photograph. icon-512.png is the new mark on the brand ground.
      logo: absoluteUrl("/brand/icon-512.png"),
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@aicareermentor.co.uk",
        contactType: "customer support",
      },
      // The brand's social profiles — both link back to this domain, which is
      // what lets Google tie them to the organization entity. (Swap the
      // Facebook URL for the vanity one once the Page can claim a username.)
      sameAs: [
        "https://www.facebook.com/profile.php?id=61593041205970",
        "https://www.tiktok.com/@aicareermentor",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-GB",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/practice`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: siteName,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: siteDescription,
      featureList: [
        "AI-tailored interview questions",
        "Answer quality scoring",
        "Voice delivery analysis",
        "Camera presence feedback",
        "Natural question audio (TTS)",
        "7-day improvement plan",
        "Saved session history",
        "Mock assessment centre",
        "AI hiring assessment platform",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "GBP",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Plus",
          price: "19",
          priceCurrency: "GBP",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "19",
            priceCurrency: "GBP",
            unitCode: "MON",
          },
        },
        {
          "@type": "Offer",
          name: "Professional",
          price: "29",
          priceCurrency: "GBP",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "29",
            priceCurrency: "GBP",
            unitCode: "MON",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      name: "How to practise for a job interview with AI Career Mentor",
      description:
        "Use AI Career Mentor to practise tailored interview questions, get scored on answer quality, voice delivery and camera presence, then receive a 7-day improvement plan.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Create your candidate profile",
          text: "Enter your target role, industry, experience level, and any CV context. This lets AI Career Mentor tailor every question to your specific situation.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Choose your interview type and format",
          text: "Select competency, technical, case study, or assessment centre. Enable voice recording and camera if you want delivery coaching on top of answer content scoring.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Answer AI questions",
          text: "Listen to each question delivered as natural audio. Answer as you would in a real interview, speaking aloud or typing. Take your time.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Review your structured feedback",
          text: "See your scores across answer quality, clarity, structure, and delivery. Read model answers for each question and identify specific areas to improve.",
        },
        {
          "@type": "HowToStep",
          position: 5,
          name: "Follow your 7-day improvement plan",
          text: "Each session produces a personalised plan with daily actions targeting your weakest areas. Track progress across sessions over time.",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Global Clerk URLs: without these, fallback flows (sign-out bounces,
    // expired sessions, account-portal links) land on Clerk's HOSTED pages at
    // accounts.aicareermentor.co.uk, which carry default Clerk branding. The
    // admin area is unaffected (middleware sends it to /admin/sign-in).
    <ClerkProvider
      signInUrl="/for-candidates/sign-in"
      signUpUrl="/for-candidates/sign-up"
      afterSignOutUrl="/"
    >
      <html lang="en-GB" className={`${sans.variable} ${mono.variable}`}>
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
          {children}
          <AttributionCapture />
          {/* Signed-in behavioural telemetry. No-ops for anonymous visitors —
              the API drops anything without a session. */}
          <ActivityTracker />
          <DeferredMentorChat />
          <CookieConsent />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
