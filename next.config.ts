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
    // Report-only first so it can't break Clerk/Stripe/Sentry — review reports,
    // then promote to an enforcing Content-Security-Policy.
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://js.stripe.com https://*.vercel-scripts.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.upstash.io https://vitals.vercel-insights.com",
      "frame-src 'self' https://js.stripe.com https://*.clerk.com https://challenges.cloudflare.com",
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
        source: "/candidates",
        destination: "/for-candidates",
        permanent: true,
      },
      {
        source: "/enterprise",
        destination: "/for-business",
        permanent: true,
      },
      {
        source: "/platform",
        destination: "/for-candidates/interview-practice",
        permanent: true,
      },
      {
        source: "/how-it-works",
        destination: "/for-candidates/interview-practice",
        permanent: true,
      },
    ];
  },
  images: {
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
      autoInstrumentServerFunctions: false,
    })
  : nextConfig;
