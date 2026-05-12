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

// Preserve the singleton across hot reloads in development.
// In production (Vercel), each function instance creates its own client,
// which is why DATABASE_URL must point to a connection pooler.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
