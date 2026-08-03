import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  {
    // Deprecated header; modern guidance is to disable it and rely on CSP.
    key: "X-XSS-Protection",
    value: "0",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // tally.so powers the university-licensing enquiry popup on /universities
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.shared.net https://clerk.aicareermentor.co.uk https://accounts.aicareermentor.co.uk https://challenges.cloudflare.com https://js.stripe.com https://*.vercel-scripts.com https://va.vercel-scripts.com https://cdn.jsdelivr.net https://tally.so",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.shared.net https://clerk.aicareermentor.co.uk https://accounts.aicareermentor.co.uk https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.upstash.io https://vitals.vercel-insights.com https://cdn.jsdelivr.net https://storage.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.shared.net https://clerk.aicareermentor.co.uk https://accounts.aicareermentor.co.uk https://challenges.cloudflare.com https://tally.so",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "media-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Permanent redirects (308) to keep old SEO and any in-the-wild links
  // working after the site split. Old marketing URLs point to their new
  // audience-scoped homes.
  async redirects() {
    return [
      {
        // www -> apex, preserving the path, as a permanent (308) redirect. This
        // is defence in depth alongside Vercel's platform-level canonicalisation
        // (which currently serves a temporary 307): if that platform setting is
        // ever removed, the app still canonicalises www to the apex correctly.
        // Same direction as Vercel's redirect, so it cannot cause a loop.
        source: "/:path*",
        has: [{ type: "host", value: "www.aicareermentor.co.uk" }],
        destination: "https://aicareermentor.co.uk/:path*",
        permanent: true,
      },
      // ── Single-audience consolidation (stage 1: the duplicate pages) ────────
      // The audience split left a full /for-candidates/* tree duplicating the
      // top-level pages, and a second homepage at /for-candidates. Now that
      // there is one audience these are redundant, split ranking authority
      // between two URLs, and cost the visitor a click. Each target below is a
      // real page that does not itself redirect, so there is no loop.
      //
      // NOT redirected here, deliberately: /for-candidates/{sign-in,sign-up}
      // (auth, still linked from the header), and the three UNIQUE product
      // pages (interview-practice, assessment-centre, pricing) — those carry
      // their own SEO content and are promoted to top-level in stage 2, which
      // needs file moves rather than redirects.
      { source: "/for-candidates", destination: "/", permanent: true },
      { source: "/for-candidates/about", destination: "/about", permanent: true },
      { source: "/for-candidates/blog", destination: "/blog", permanent: true },
      { source: "/for-candidates/questions", destination: "/questions", permanent: true },
      { source: "/for-candidates/star-scorer", destination: "/tools/star-scorer", permanent: true },
      // Stage 2: the three unique product pages, now promoted to top level.
      { source: "/for-candidates/interview-practice", destination: "/interview-practice", permanent: true },
      // /assessment-centre is the authenticated app route, so the marketing page
      // took a new, descriptive slug rather than colliding with it.
      { source: "/for-candidates/assessment-centre", destination: "/mock-assessment-centre", permanent: true },
      { source: "/for-candidates/pricing", destination: "/pricing", permanent: true },
      {
        // Was → /for-candidates, which would now chain through the redirect
        // above. Point straight at the homepage instead.
        source: "/candidates",
        destination: "/",
        permanent: true,
      },
      {
        source: "/enterprise",
        destination: "/for-business",
        permanent: true,
      },
      {
        source: "/platform",
        destination: "/interview-practice",
        permanent: true,
      },
      {
        source: "/how-it-works",
        destination: "/interview-practice",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

// Only wrap with Sentry when a DSN is configured. This keeps local dev and
// preview deployments free of Sentry overhead until you're ready to enable it.
const hasSentryDsn = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

export default hasSentryDsn
  ? withSentryConfig(nextConfig, {
      // Suppresses Sentry build-step logs unless there's an error.
      silent: true,
      // Upload source maps to Sentry so stack traces resolve to real code.
      // Requires SENTRY_AUTH_TOKEN env var (set in Vercel project settings).
      sourcemaps: { disable: false },
      // Automatically instrument server components and route handlers.
      webpack: { autoInstrumentServerFunctions: false },
    })
  : nextConfig;
