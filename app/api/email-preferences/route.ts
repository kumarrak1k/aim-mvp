import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getEmailPreference,
  setMarketingConsent,
} from "@/app/lib/emailPreferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function primaryEmail(userId: string): Promise<string> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.emailAddresses[0]?.emailAddress ?? "";
}

/** GET — current marketing-email consent for the signed-in candidate. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const pref = await getEmailPreference(userId);
    return NextResponse.json({
      // No row yet → treat as opted-in (legacy grandfathering); the UI can
      // still show this as "on" and let the user turn it off.
      marketingConsent: pref ? pref.marketingConsent : true,
      hasRecord: Boolean(pref),
    });
  } catch (error) {
    console.error("EMAIL PREFERENCES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load preferences." }, { status: 500 });
  }
}

/** POST { marketingConsent: boolean, source?: "signup" | "preferences" } */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      marketingConsent?: unknown;
      source?: unknown;
    };
    if (typeof body.marketingConsent !== "boolean") {
      return NextResponse.json(
        { error: "marketingConsent (boolean) is required." },
        { status: 400 }
      );
    }
    const source = body.source === "signup" ? "signup" : "preferences";
    const email = await primaryEmail(userId);
    await setMarketingConsent(userId, email, body.marketingConsent, source);
    return NextResponse.json({ ok: true, marketingConsent: body.marketingConsent });
  } catch (error) {
    console.error("EMAIL PREFERENCES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to save preferences." }, { status: 500 });
  }
}
