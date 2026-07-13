/**
 * Prisma client singleton.
 *
 * Serverless connection pooling setup (do this in your hosting dashboard):
 *
 * If using Supabase:
 *   DATABASE_URL  → Transaction pooler URL  (port 6543) — used by the app
 *   DIRECT_URL    → Direct connection URL   (port 5432) — used for migrations
 *   Add ?pgbouncer=true to DATABASE_URL if not already present.
 *
 * If using another Postgres host, point DATABASE_URL at your PgBouncer or
 * Prisma Accelerate endpoint, and DIRECT_URL at the direct Postgres URL.
 *
 * Both env vars are already wired into prisma/schema.prisma.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function buildPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

/**
 * Wake the database before a scheduled job touches it.
 *
 * Neon suspends idle compute; the first connection after a suspend can
 * exceed Prisma's connect timeout and throw PrismaClientInitializationError
 * ("Can't reach database server"). Crons fire at quiet hours, so they hit
 * this cold path far more often than user traffic does. Retrying a trivial
 * query with backoff gives the compute time to resume; if the database is
 * genuinely down, the final attempt still throws.
 */
export async function warmDb(attempts = 6): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      // A refused connection fails in milliseconds, so the sleeps dominate
      // the window: 2+4+6+8+8 = 28s, enough for Neon's slowest resumes
      // (the 3-attempt/~6s version still failed on the 19:00 UTC 13 Jul run).
      // Callers need maxDuration >= 60.
      await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 2000, 8000)));
    }
  }
}

// Preserve the singleton across hot reloads in development.
// In production (Vercel), each function instance creates its own client,
// which is why DATABASE_URL must point to a connection pooler.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
