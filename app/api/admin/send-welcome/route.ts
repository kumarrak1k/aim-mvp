import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site";
import { sendAdminWelcomeEmail } from "@/app/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * POST /api/admin/send-welcome
 * Generates a fresh Clerk sign-in token for an admin-created account and
 * emails the one-click sign-in link to the user via Resend.
 *
 * A fresh token is generated each time so the admin can resend safely
 * (e.g. if the user didn't receive the first email).
 *
 * Body: { userId, email, firstName?, accountType }
 */
export async function POST(req: NextRequest) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    userId?: string;
    email?: string;
    firstName?: string | null;
    accountType?: string;
  };

  if (!body.userId || !body.email) {
    return NextResponse.json({ error: "userId and email are required." }, { status: 400 });
  }

  try {
    // Generate a fresh sign-in token — safe to call multiple times (each is independent)
    const tokenResponse = await admin.client.signInTokens.createSignInToken({
      userId: body.userId,
      expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    // Point to the minimal token-acceptance page — no marketing shell shown
    const signInUrl = `${siteConfig.url}/auth/accept?__clerk_ticket=${tokenResponse.token}`;

    const result = await sendAdminWelcomeEmail({
      to: body.email,
      firstName: body.firstName ?? null,
      signInUrl,
    });

    if (!result.ok) {
      console.error("SEND WELCOME EMAIL ERROR:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, signInUrl });
  } catch (error: unknown) {
    console.error("SEND WELCOME ERROR:", error);
    const msg = (error as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message
      ?? (error instanceof Error ? error.message : "Failed to send email.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
