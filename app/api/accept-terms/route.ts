import { auth } from "@clerk/nextjs/server";
import { CURRENT_TOS_VERSION, recordTosAcceptance } from "@/app/lib/legal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { error: "You must be signed in to accept the terms." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      version?: string;
      acceptTerms?: boolean;
      acceptPrivacy?: boolean;
    };

    if (!body.acceptTerms || !body.acceptPrivacy) {
      return Response.json(
        { error: "You must confirm both the Terms of Use and the Privacy Policy." },
        { status: 400 }
      );
    }

    if (body.version !== CURRENT_TOS_VERSION) {
      return Response.json(
        { error: "The terms have been updated. Please reload the page." },
        { status: 409 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0]!.trim() : null;
    const userAgent = req.headers.get("user-agent");

    await recordTosAcceptance({
      clerkUserId: userId,
      ipAddress,
      userAgent: userAgent ? userAgent.slice(0, 600) : null,
    });

    return Response.json({ ok: true, version: CURRENT_TOS_VERSION });
  } catch (error) {
    console.error("ACCEPT TERMS ERROR:", error);
    return Response.json({ error: "Could not record acceptance." }, { status: 500 });
  }
}
