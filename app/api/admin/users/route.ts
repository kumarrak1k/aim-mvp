import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site";

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
 * Generate a secure temporary password (used internally by Clerk — never shown to admin).
 * Sign-in tokens are the primary access mechanism, so this just needs to satisfy Clerk.
 */
function generateInternalPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
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

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

/** The sign-in page for each account type. */
function signInPathForType(accountType: string): string {
  return accountType === "corporate"
    ? "/for-business/sign-in"
    : "/for-candidates/sign-in";
}

/**
 * POST /api/admin/users
 * Create a new Clerk user and return a one-click sign-in link.
 *
 * Body: { email, firstName?, lastName?, accountType, subscriptionStatus?, stripePlanId? }
 * Returns: { success, userId, email, signInUrl }
 *
 * The sign-in URL contains a Clerk sign-in token (__clerk_ticket param) that
 * authenticates the user without a password or email verification code — no
 * factor-two prompt, no email required from Clerk.
 *
 * privateMetadata.forcePasswordReset = true is set on the new account so
 * /auth/redirect bounces the user to /change-password on first sign-in,
 * where they set a permanent password via the backend API (no current
 * password required since we use Clerk's admin updateUser).
 *
 * Token expires in 7 days. Share the URL securely with the user.
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

  try {
    const privateMetadata: Record<string, unknown> = {
      accountType: body.accountType,
      forcePasswordReset: true,
    };
    if (body.subscriptionStatus) privateMetadata.subscriptionStatus = body.subscriptionStatus;
    if (body.stripePlanId)        privateMetadata.stripePlanId       = body.stripePlanId;

    // Create the Clerk account. Email addresses created via the Backend API are
    // automatically marked as verified — no OTP needed.
    const user = await admin.client.users.createUser({
      emailAddress: [email],
      password: generateInternalPassword(), // internal only, never shown
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      skipPasswordChecks: true,
      privateMetadata,
    });

    // Generate a sign-in token — a one-time JWT that authenticates the user
    // without password or MFA. Valid for 7 days.
    const tokenResponse = await admin.client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    // Build the full sign-in URL. Clerk's embedded <SignIn /> component
    // automatically detects __clerk_ticket in the URL and authenticates
    // the user without any further prompts.
    const signInPath = signInPathForType(body.accountType);
    const signInUrl = `${siteConfig.url}${signInPath}?__clerk_ticket=${tokenResponse.token}`;

    return NextResponse.json({
      success: true,
      userId: user.id,
      email,
      signInUrl,
    });
  } catch (error: unknown) {
    console.error("ADMIN CREATE USER ERROR:", error);
    const msg =
      (error as { errors?: Array<{ longMessage?: string; message?: string }> })
        ?.errors?.[0]?.longMessage ??
      (error as { errors?: Array<{ message?: string }> })
        ?.errors?.[0]?.message ??
      (error instanceof Error ? error.message : "Failed to create user.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
