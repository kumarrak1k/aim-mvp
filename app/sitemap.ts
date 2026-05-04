import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/app/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return siteConfig.routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency:
      route.path === "/" || route.path === "/practice" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}