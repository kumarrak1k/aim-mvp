import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

// New candidates auto-start a 7-day trial at sign-up, so the sequence is
// trial-aware: a "few days left" nudge at day 5 and a "trial ended" notice at
// day 7 (which replaces the old generic day-7 upgrade email).
const SEQUENCE: Array<{ type: string; delayDays: number }> = [
  { type: "welcome",        delayDays: 0  },
  { type: "day2_tip",       delayDays: 2  },
  { type: "day4_social",    delayDays: 4  },
  { type: "trial_midway",   delayDays: 5  },
  { type: "trial_ended",    delayDays: 7  },
  { type: "day14_reengage", delayDays: 14 },
  { type: "day21_nudge",    delayDays: 21 },
  { type: "day30_winback",  delayDays: 30 },
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
