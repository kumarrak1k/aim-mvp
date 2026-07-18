import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { enqueueNurtureSequence } from "@/app/lib/nurtureSequence";

export const runtime = "nodejs";

/**
 * Client-fired enqueue from the sign-up completion page. The authoritative
 * path is server-side (trial auto-start helper) — this remains as an extra
 * belt-and-braces trigger. Shared lib is idempotent per email type.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let email: string;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    email = user.emailAddresses[0]?.emailAddress ?? "";
  } catch {
    return NextResponse.json({ error: "Could not fetch user" }, { status: 500 });
  }

  if (!email) return NextResponse.json({ ok: true, skipped: true });

  await enqueueNurtureSequence(userId, email);
  return NextResponse.json({ ok: true });
}
