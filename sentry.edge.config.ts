/**
 * Sentry edge runtime configuration (middleware, edge API routes).
 * Only activates when SENTRY_DSN is set (production).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
      }
      if (event.extra) {
        delete event.extra.body;
        delete event.extra.detail;
      }
      return event;
    },
    debug: false,
  });
}
