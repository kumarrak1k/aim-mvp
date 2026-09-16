import { Prisma } from "@prisma/client";

/**
 * Transient database failures, and one retry for them.
 *
 * Neon closes pooled connections it considers idle and suspends the compute
 * behind them. A serverless function that has been warm for a few minutes can
 * therefore hold a socket the database has already hung up on, and the next
 * query fails with "Server has closed the connection" or "Can't reach database
 * server" before Prisma has had a chance to reconnect. The connection is
 * re-established immediately afterwards, so the same call succeeds on a second
 * attempt milliseconds later.
 *
 * These are not bugs and there is nothing to fix at the call site: the only
 * wrong thing to do is treat them like real failures. `warmDb` in ./prisma
 * covers the other end of the same problem - a cron waking a suspended compute
 * - with a much longer budget. This is the user-traffic version: one quick
 * retry, not half a minute of backoff.
 */

/** Prisma error codes that mean "the connection went away", not "the write was wrong". */
const TRANSIENT_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server reached but timed out
  "P1008", // Operation timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);

export function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_CODES.has(error.code);
  }
  return false;
}

/**
 * Run a database call, retrying only if it failed for a transient reason.
 *
 * Anything else - a constraint violation, a bad query, a validation error - is
 * rethrown on the first attempt: retrying a call that is wrong just makes it
 * wrong twice.
 */
export async function withDbRetry<T>(
  run: () => Promise<T>,
  options: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  const attempts = options.attempts ?? 2;
  const delayMs = options.delayMs ?? 150;

  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts || !isTransientDbError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
