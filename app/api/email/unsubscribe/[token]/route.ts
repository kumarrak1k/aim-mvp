import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/app/lib/emailPreferences";
import { siteConfig } from "@/app/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * POST — RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). Email clients
 * (Gmail, Apple Mail) POST here directly; must succeed without a login.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  await unsubscribeByToken(token).catch(() => ({ ok: false }));
  // Always 200 so the mail client shows success even on a stale token.
  return NextResponse.json({ ok: true });
}

/**
 * GET — a human clicked the List-Unsubscribe URL directly. Process the opt-out
 * and redirect to the friendly confirmation page.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  await unsubscribeByToken(token).catch(() => ({ ok: false }));
  return NextResponse.redirect(`${siteConfig.url}/unsubscribe/${token}`);
}
