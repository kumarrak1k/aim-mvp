import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/change-password
 * Backend-side password update for admin-created accounts that have
 * privateMetadata.forcePasswordReset = true.
 *
 * Using the Clerk backend API avoids requiring the current (temp) password
 * on the client — the user's authenticated session is proof enough.
 *
 * Body: { newPassword: string }
 *
 * Security: only works when forcePasswordReset is true in privateMetadata.
 * Normal password changes go through Clerk's standard profile UI.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { newPassword?: string };
  const newPassword = body.newPassword ?? "";

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = (user.privateMetadata ?? {}) as Record<string, unknown>;

    // Only allow this route for accounts that actually require a password reset
    if (!meta.forcePasswordReset) {
      return NextResponse.json(
        { error: "No password reset required for this account." },
        { status: 403 }
      );
    }

    // Set the new password via the backend API (no current-password check needed)
    await client.users.updateUser(userId, { password: newPassword });

    // Clear the forcePasswordReset flag — keep all other metadata intact
    const { forcePasswordReset: _removed, ...rest } = meta;
    await client.users.updateUserMetadata(userId, { privateMetadata: rest });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("CHANGE PASSWORD ERROR:", error);
    const msg =
      (error as { errors?: Array<{ longMessage?: string; message?: string }> })
        ?.errors?.[0]?.longMessage ??
      (error instanceof Error ? error.message : "Failed to update password.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
