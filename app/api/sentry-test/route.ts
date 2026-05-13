import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Temporary Sentry verification endpoint.
 * Visit /api/sentry-test to throw a test error and confirm Sentry is capturing.
 * DELETE THIS FILE once confirmed working.
 */
export async function GET() {
  throw new Error("Sentry test error — AI Career Mentor production verification");
  return NextResponse.json({ ok: true });
}
