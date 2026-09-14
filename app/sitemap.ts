import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/app/config/site";
import { getAllPosts, getAllQuestionSets } from "@/app/lib/content";
import { COMPANY_GUIDES } from "@/app/companies/data";

// Rendered per request so scheduled (future-dated) posts appear the moment
// their date passes.
//
// This used to be `revalidate = 3600`, but Next froze the metadata route at
// build time and never regenerated it: on 14 Sep 2026 the live sitemap's
// <lastmod> still read the 7 Sep deploy time, and the post dated 13 Sep was
// missing even though its page was live. Reading the MDX frontmatter is cheap
// and crawlers fetch this rarely, so there is no cache worth protecting.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Exclude authenticated-only routes — they redirect to Clerk sign-in
  // for unauthenticated users and must not appear in the sitemap.
  const EXCLUDE_FROM_SITEMAP = new Set(["/practice", "/profile"]);

  const staticRoutes: MetadataRoute.Sitemap = siteConfig.routes
    // `hidden` covers the corporate and university pages: still reachable by
    // direct link for anyone who has been sent one, but not advertised to
    // search while that offer moves to its own site.
    .filter((route) => !route.hidden)
    .filter((route) => !EXCLUDE_FROM_SITEMAP.has(route.path))
    .map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.path === "/" ? "weekly" : "monthly",
      priority: route.priority,
    }));

  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const questionSets: MetadataRoute.Sitemap = getAllQuestionSets().map((qs) => ({
    url: absoluteUrl(`/questions/${qs.slug}`),
    lastModified: qs.date ? new Date(qs.date) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const companyGuides: MetadataRoute.Sitemap = COMPANY_GUIDES.map((guide) => ({
    url: absoluteUrl(`/companies/${guide.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...blogPosts, ...questionSets, ...companyGuides];
}