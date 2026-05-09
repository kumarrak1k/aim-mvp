import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const SEQUENCE: Array<{ type: string; delayDays: number }> = [
  { type: "welcome",       delayDays: 0 },
  { type: "day3_tip",      delayDays: 3 },
  { type: "day7_progress", delayDays: 7 },
];

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Idempotent — skip if already enqueued
  const existing = await prisma.emailJob.findFirst({ where: { userId } });
  if (existing) return NextResponse.json({ ok: true, skipped: true });

  // Get email from Clerk
  let email: string;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    email = user.emailAddresses[0]?.emailAddress ?? "";
  } catch {
    return NextResponse.json({ error: "Could not fetch user" }, { status: 500 });
  }

  if (!email) return NextResponse.json({ ok: true, skipped: true });

  const now = new Date();
  await prisma.emailJob.createMany({
    data: SEQUENCE.map(({ type, delayDays }) => {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + delayDays);
      return { userId, email, type, scheduledAt };
    }),
  });

  return NextResponse.json({ ok: true });
}
