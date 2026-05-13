import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight health check used by uptime monitors (UptimeRobot, BetterStack, etc.).
 *
 * Reports:
 *   - status: "ok" (all dependencies reachable) or "degraded" (DB unreachable)
 *   - uptime: process uptime in seconds — useful for spotting frequent restarts
 *   - timestamp: ISO timestamp of the response
 *   - database: "up" or "down"
 *
 * Always returns 200 unless dependencies fail, in which case 503. That lets
 * uptime monitors trigger alerts on real failures rather than just route
 * misconfiguration.
 */
export async function GET() {
  const startedAt = Date.now();

  let databaseUp = false;
  try {
    // Cheapest possible round-trip — confirms the connection works.
    await prisma.$queryRaw`SELECT 1`;
    databaseUp = true;
  } catch (error) {
    console.error("HEALTH CHECK DB ERROR:", error);
  }

  const body = {
    status: databaseUp ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
    database: databaseUp ? "up" : "down",
  };

  return NextResponse.json(body, { status: databaseUp ? 200 : 503 });
}
