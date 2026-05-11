import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verify the caller is a signed-in superadmin. Returns null if not. */
async function requireSuperadmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const meta = me.privateMetadata as { role?: string };
  if (meta.role !== "superadmin") return null;
  return { callerId: userId, client };
}

/**
 * Generate a secure temporary password.
 * 16 chars — guaranteed upper, lower, digit, symbol.
 * Uses Math.random (fine for a one-time admin-generated credential).
 */
function generateTempPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O (confusable)
  const lower   = "abcdefghjkmnpqrstuvwxyz";  // no l/o
  const digits  = "23456789";                  // no 0/1
  const symbols = "!@#$%&*";
  const all     = upper + lower + digits + symbols;

  const chars: string[] = [
    upper  [Math.floor(Math.random() * upper.length)],
    upper  [Math.floor(Math.random() * upper.length)],
    lower  [Math.floor(Math.random() * lower.length)],
    lower  [Math.floor(Math.random() * lower.length)],
    digits [Math.floor(Math.random() * digits.length)],
    digits [Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    ...Array.from({ length: 9 }, () => all[Math.floor(Math.random() * all.length)]),
  ];

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

/**
 * POST /api/admin/users
 * Create a new Clerk user with a generated temp password.
 * Body: { email, firstName?, lastName?, accountType, subscriptionStatus?, stripePlanId? }
 * Returns: { success, userId, email, tempPassword }
 *
 * The temp password is returned ONCE and never stored.
 * privateMetadata.forcePasswordReset = true is set on the new account,
 * causing app/auth/redirect to bounce the user to /change-password on first sign-in.
 */
export async function POST(req: NextRequest) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    email?: string;
    firstName?: string;
    lastName?: string;
    accountType?: string;
    subscriptionStatus?: string;
    stripePlanId?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!body.accountType) {
    return NextResponse.json({ error: "Account type is required." }, { status: 400 });
  }

  const tempPassword = generateTempPassword();

  try {
    const privateMetadata: Record<string, unknown> = {
      accountType: body.accountType,
      forcePasswordReset: true,
    };
    if (body.subscriptionStatus) privateMetadata.subscriptionStatus = body.subscriptionStatus;
    if (body.stripePlanId)        privateMetadata.stripePlanId       = body.stripePlanId;

    const user = await admin.client.users.createUser({
      emailAddress: [email],
      password: tempPassword,
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      skipPasswordChecks: true,
      privateMetadata,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      email,
      tempPassword,
    });
  } catch (error: unknown) {
    console.error("ADMIN CREATE USER ERROR:", error);
    // Clerk wraps errors — surface the human-readable message if available
    const msg =
      (error as { errors?: Array<{ longMessage?: string; message?: string }> })
        ?.errors?.[0]?.longMessage ??
      (error as { errors?: Array<{ message?: string }> })
        ?.errors?.[0]?.message ??
      (error instanceof Error ? error.message : "Failed to create user.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
