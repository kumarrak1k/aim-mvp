import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { CookieConsent } from "@/app/components/marketing/CookieConsent";
import { MentorChat } from "@/app/components/marketing/MentorChat";
import "./globals.css";

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
        alt: "AI Career Mentor — AI Interview Coaching",
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
  icons: {
    icon: "/brand/logo.jpg",
    shortcut: "/brand/logo.jpg",
    apple: "/brand/logo.jpg",
  },
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
      logo: absoluteUrl("/brand/logo.jpg"),
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@aicareermentor.co.uk",
        contactType: "customer support",
      },
      sameAs: [],
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
          name: "Answer AI-generated questions",
          text: "Listen to each question delivered as natural audio. Answer as you would in a real interview — speaking aloud or typing. Take your time.",
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
    <ClerkProvider>
      <html lang="en-GB">
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
          {children}
          <MentorChat />
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
