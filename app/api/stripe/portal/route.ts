import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireStripe } from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to manage your subscription." }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.privateMetadata as { stripeCustomerId?: string };
  const customerId = meta?.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe to a plan first." },
      { status: 404 }
    );
  }

  const stripeClient = requireStripe();
  const portalSession = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl("/profile"),
  });

  return NextResponse.json({ url: portalSession.url });
}
