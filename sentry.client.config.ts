/**
 * Sentry client-side configuration.
 * Only activates when NEXT_PUBLIC_SENTRY_DSN is set (production).
 * Safe to deploy without the DSN — all Sentry calls become no-ops.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",

    // Capture 10 % of transactions for performance monitoring.
    // Adjust up once you know your traffic volume.
    tracesSampleRate: 0.1,

    // Record a session replay only when an error occurs.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],

    // Don't clutter logs in dev.
    debug: false,
  });
}
