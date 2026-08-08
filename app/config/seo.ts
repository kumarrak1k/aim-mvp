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

  // Strip any trailing brand suffix so it can never be doubled.
  const stripped = title
    .replace(/\s*\|\s*AI Career Mentor\s*$/, "")
    .replace(/\s*—\s*AI Career Mentor\s*$/, "")
    .trim();

  // If the brand still appears mid-title (e.g. "About AI Career Mentor — Story")
  // return it as-is — appending the suffix would produce double-brand.
  if (stripped.includes(siteConfig.name)) {
    return stripped;
  }

  return `${stripped} | ${siteConfig.name}`;
}

// The sister site serves international English plus FR/DE/ES. Declaring the
// cross-domain language alternates stops Google treating the two sites'
// near-identical English content as duplicates and picking one winner —
// .co.uk is the UK edition, .com the international one.
const INTERNATIONAL_URL = "https://aicareermentor.com";

/**
 * Paths that are NOT the same on both sites.
 *
 * These .co.uk marketing pages were renamed when the site collapsed to a
 * single audience (/for-candidates/x -> /x, and the assessment centre page
 * took a keyword-led name); .com kept the audience-prefixed originals. The
 * naive same-path swap below therefore advertised alternates that 404 —
 * /mock-assessment-centre pointed at five dead .com URLs. Google discards the
 * whole hreflang cluster for a page when its alternates don't resolve, which
 * left the sister pages competing as undeclared duplicates instead of being
 * grouped, and .com's assessment centre page unindexed.
 *
 * Anything absent from this map exists at the same path on both sites.
 */
const INTERNATIONAL_PATH: Record<string, string> = {
  "/interview-practice": "/for-candidates/interview-practice",
  "/mock-assessment-centre": "/for-candidates/assessment-centre",
  "/pricing": "/for-candidates/pricing",
};

function buildLanguageAlternates(path: string): Record<string, string> {
  const ukPath = path === "/" ? "" : path;
  const intlBase = INTERNATIONAL_PATH[path] ?? path;
  const intlPath = intlBase === "/" ? "" : intlBase;

  return {
    "en-GB": `${siteConfig.url}${ukPath}`,
    en: `${INTERNATIONAL_URL}${intlPath}`,
    fr: `${INTERNATIONAL_URL}/fr${intlPath}`,
    de: `${INTERNATIONAL_URL}/de${intlPath}`,
    es: `${INTERNATIONAL_URL}/es${intlPath}`,
    "x-default": `${INTERNATIONAL_URL}${intlPath}`,
  };
}

/**
 * Canonical + cross-domain hreflang for a dynamic page (blog posts, question
 * sets, company guides, competitor comparisons) whose metadata is built by
 * hand rather than through createPageMetadata. Without the `languages` block
 * these pages exist identically on .co.uk and .com with only a self-canonical,
 * so Google treats them as duplicate English pages and splits their ranking.
 * Pass an absolute path beginning with "/".
 */
export function buildAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: absoluteUrl(path),
    languages: buildLanguageAlternates(path),
  };
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
      languages: noIndex ? undefined : buildLanguageAlternates(path),
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