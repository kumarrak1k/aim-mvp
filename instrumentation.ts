/**
 * Next.js instrumentation hook — wires up Sentry for server and edge runtimes.
 * The client runtime is handled by sentry.client.config.ts.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Required for App Router — forwards unhandled route handler and server
 * component errors to Sentry. Without this, server-side 500s are not captured.
 */
export const onRequestError = Sentry.captureRequestError;
