/**
 * Sentry server-side (Node.js) configuration.
 * Only activates when SENTRY_DSN is set (production).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",

    // Lower sample rate on the server — most value comes from errors, not traces.
    tracesSampleRate: 0.05,

    debug: false,
  });
}
