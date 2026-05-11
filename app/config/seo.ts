import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "@/app/config/site";

type SeoRoute = (typeof siteConfig.routes)[number];

type CreatePageMetadataInput = {
  path: SeoRoute["path"];
  title?: string;
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
};

function findRoute(path: SeoRoute["path"]) {
  return siteConfig.routes.find((route) => route.path === path);
}

function buildTitle(title?: string) {
  if (!title) {
    return siteConfig.title;
  }

  if (title.includes(siteConfig.name)) {
    return title;
  }

  return `${title} | ${siteConfig.name}`;
}

export function createPageMetadata({
  path,
  title,
  description,
  keywords = [],
  noIndex = false,
}: CreatePageMetadataInput): Metadata {
  const route = findRoute(path);
  const pageTitle = buildTitle(title ?? route?.label);
  const pageDescription =
    description ?? route?.description ?? siteConfig.description;
  const canonicalUrl = absoluteUrl(path);

  return {
    metadataBase: new URL(siteConfig.url),
    // { absolute } bypasses the layout's "%s | AI Career Mentor" template so
    // the suffix never doubles (buildTitle already appends it when needed).
    title: { absolute: pageTitle },
    description: pageDescription,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export const defaultMetadata = createPageMetadata({
  path: "/",
  title: siteConfig.title,
  description: siteConfig.description,
});