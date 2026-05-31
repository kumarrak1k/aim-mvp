import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/go-live-check — superadmin-only pre-launch readiness probe.
 *
 * Verifies every piece of config the Stripe-live switch depends on: keys (and
 * their mode), webhook secrets, all price IDs (by actually retrieving each from
 * Stripe so stale/test IDs are caught), the payments flag, CRON_SECRET, and the
 * pooled DATABASE_URL params. Returns a green/amber/red checklist.
 *
 * Hit this right after setting the live env vars to confirm `ready: true`.
 */

async function requireSuperadmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const meta = me.privateMetadata as { role?: string };
  if (meta.role !== "superadmin") return null;
  return { callerId: userId };
}

const PRICE_ENV_VARS = [
  "STRIPE_PRICE_PLUS_MONTHLY",
  "STRIPE_PRICE_PLUS_ANNUAL",
  "STRIPE_PRICE_PROFESSIONAL_MONTHLY",
  "STRIPE_PRICE_PROFESSIONAL_ANNUAL",
  "STRIPE_PRICE_CORPORATE_TEAM_MONTHLY",
  "STRIPE_PRICE_CORPORATE_TEAM_ANNUAL",
  "STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY",
  "STRIPE_PRICE_CORPORATE_BUSINESS_ANNUAL",
] as const;

type Status = "ok" | "warn" | "fail";
type Check = { key: string; status: Status; detail: string };

export async function GET() {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Superadmin only." }, { status: 403 });
  }

  const checks: Check[] = [];
  const add = (key: string, status: Status, detail: string) =>
    checks.push({ key, status, detail });
  const present = (k: string) => Boolean(process.env[k]);

  // ── Stripe keys + mode ────────────────────────────────────────────────────
  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const isLiveSecret = secret.startsWith("sk_live_");
  add(
    "STRIPE_SECRET_KEY",
    secret ? "ok" : "fail",
    secret ? (isLiveSecret ? "live mode" : "TEST mode") : "missing"
  );
  add(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    pub ? "ok" : "fail",
    pub.startsWith("pk_live_") ? "live" : pub.startsWith("pk_test_") ? "TEST" : "missing/invalid"
  );
  if (secret && pub && isLiveSecret !== pub.startsWith("pk_live_")) {
    add("stripe-key-mode-match", "fail", "secret and publishable keys are in DIFFERENT modes");
  }

  // ── Webhook secrets + flags ───────────────────────────────────────────────
  add("STRIPE_WEBHOOK_SECRET", present("STRIPE_WEBHOOK_SECRET") ? "ok" : "fail", present("STRIPE_WEBHOOK_SECRET") ? "set" : "missing (candidate webhook)");
  add("STRIPE_WEBHOOK_SECRET_CORPORATE", present("STRIPE_WEBHOOK_SECRET_CORPORATE") ? "ok" : "fail", present("STRIPE_WEBHOOK_SECRET_CORPORATE") ? "set" : "missing (corporate webhook)");
  add("NEXT_PUBLIC_PAYMENTS_ENABLED", process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true" ? "ok" : "warn", process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true" ? "true" : "not 'true' — upgrade/subscribe buttons hidden");
  add("CRON_SECRET", present("CRON_SECRET") ? "ok" : "fail", present("CRON_SECRET") ? "set" : "missing — nurture cron fails closed");

  // ── DB connection (serverless scale) ──────────────────────────────────────
  // Neon's connection pooler natively supports prepared statements, so the
  // pooled (-pooler) host is scale-safe WITHOUT pgbouncer=true — Neon's own
  // Prisma preset omits it. Just confirm we're on the pooled host.
  const db = process.env.DATABASE_URL ?? "";
  const isNeonPooler = db.includes("-pooler.");
  const hasPgbouncer = db.includes("pgbouncer=true");
  add(
    "DATABASE_URL connection",
    isNeonPooler || hasPgbouncer ? "ok" : "warn",
    isNeonPooler
      ? "Neon pooled host (prepared statements supported natively — pgbouncer not required)"
      : hasPgbouncer
      ? "pgbouncer=true set"
      : "not on a Neon pooler host and no pgbouncer=true — check the connection string"
  );

  // ── Price IDs — present AND resolvable in the current Stripe mode ──────────
  for (const k of PRICE_ENV_VARS) {
    const id = process.env[k];
    if (!id) {
      add(k, "fail", "missing");
      continue;
    }
    if (!stripe) {
      add(k, "warn", "set, but Stripe client not configured");
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(id);
      const modeMatch = price.livemode === isLiveSecret;
      add(
        k,
        price.active && modeMatch ? "ok" : "warn",
        `${price.livemode ? "live" : "test"} price, active=${price.active}${modeMatch ? "" : " — MODE MISMATCH vs secret key"}`
      );
    } catch {
      add(k, "fail", "does NOT resolve in Stripe (wrong/stale ID for this mode)");
    }
  }

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };

  return NextResponse.json({
    ready: summary.fail === 0,
    stripeMode: isLiveSecret ? "live" : secret.startsWith("sk_test_") ? "test" : "unknown",
    summary,
    checks,
  });
}
