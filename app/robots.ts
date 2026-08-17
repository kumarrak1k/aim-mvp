import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/app/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // ── API routes ────────────────────────────────────────────────
          "/api/",

          // ── Authenticated app routes ──────────────────────────────────
          // All of these redirect to Clerk sign-in for unauthenticated
          // users — no indexable content, just wastes crawl budget.
          "/company/",
          "/admin/",
          "/auth/",
          "/career-docs/",
          "/profile/",
          "/progress/",
          "/refer",
          "/accept-terms",
          "/change-password",

          // ── Private session/assessment routes ─────────────────────────
          // These use tokenised or session IDs — never publicly indexable.
          "/practice/session",
          "/assessment/",
          "/assessment-centre/",

          // ── Auth flow pages (no standalone SEO value) ─────────────────
          "/for-candidates/sign-in/",
          "/for-candidates/sign-up/complete",
          "/for-candidates/auth-complete",
          "/for-business/sign-in/",
          "/for-business/sign-up/complete",
          "/for-business/auth-complete",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}