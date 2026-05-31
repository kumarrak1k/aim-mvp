import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { suppressEmail } from "@/app/lib/emailSuppression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/resend — records hard bounces and spam complaints so we
 * stop emailing dead/complaining addresses (protects sender reputation).
 *
 * Resend signs webhooks with Svix. We verify the signature manually (no extra
 * dependency): HMAC-SHA256 of "${id}.${timestamp}.${body}" with the base64
 * webhook secret. Configure RESEND_WEBHOOK_SECRET (whsec_...) and point a
 * Resend webhook here for the email.bounced + email.complained events.
 */
function verifySvix(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string
): boolean {
  try {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const signed = `${id}.${timestamp}.${body}`;
    const expected = crypto
      .createHmac("sha256", secretBytes)
      .update(signed)
      .digest("base64");
    // Header is a space-separated list of "v1,<signature>" entries.
    const provided = signatureHeader
      .split(" ")
      .map((p) => p.split(",")[1])
      .filter(Boolean);
    return provided.some((sig) => {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND WEBHOOK: RESEND_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers." }, { status: 400 });
  }

  // Replay protection — reject events more than 5 minutes off.
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return NextResponse.json({ error: "Stale timestamp." }, { status: 400 });
  }

  const body = await req.text();
  if (!verifySvix(secret, svixId, svixTimestamp, body, svixSignature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { type?: string; data?: { to?: string | string[] } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const reason =
    event.type === "email.bounced"
      ? "bounced"
      : event.type === "email.complained"
      ? "complained"
      : null;

  if (reason) {
    const to = event.data?.to;
    const recipients = Array.isArray(to) ? to : to ? [to] : [];
    for (const addr of recipients) {
      try {
        await suppressEmail(addr, reason);
      } catch (err) {
        console.error("RESEND WEBHOOK: suppress failed", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
