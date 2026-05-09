import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/app/config/site";
import { getAllPosts, getAllQuestionSets } from "@/app/lib/content";
import { COMPANY_GUIDES } from "@/app/companies/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = siteConfig.routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency:
      route.path === "/" || route.path === "/practice" ? "weekly" : "monthly",
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