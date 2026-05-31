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

    // Never attach IPs/cookies/headers automatically.
    sendDefaultPii: false,

    // Our API routes carry CV text, interview answers and transcripts in
    // request bodies. Strip request data + sensitive extras from every event
    // so personal content can never reach Sentry (our privacy claims depend
    // on this — client replays mask, but server errors must scrub too).
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
