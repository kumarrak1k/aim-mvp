import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { absoluteUrl, siteConfig } from "@/app/config/site";
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
  alternates: {
    canonical: siteUrl,
  },
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
    title: "AI Career Mentor | AI Interview Coach",
    description: siteDescription,
    images: ["/brand/logo.jpg"],
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
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: siteName,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: siteDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
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
        </body>
      </html>
    </ClerkProvider>
  );
}