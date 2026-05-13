/**
 * Next.js instrumentation hook — wires up Sentry for server and edge runtimes.
 * The client runtime is handled by sentry.client.config.ts.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
