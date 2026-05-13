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
    // Privacy: mask all text inputs and block all images so that CV content,
    // interview answers, and personal data are never captured in replays.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        // Mask every text input field — catches CV text areas, answer boxes, etc.
        maskAllInputs: true,
        // Mask all plain text nodes so on-screen CV/answer content is redacted.
        maskAllText: true,
        // Block all images (profile photos, uploaded files shown as previews).
        blockAllMedia: true,
      }),
    ],

    // Don't clutter logs in dev.
    debug: false,
  });
}
