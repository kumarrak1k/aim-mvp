import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let code: string;
  try {
    const body = await req.json();
    code = (body.code ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!code) return NextResponse.json({ ok: true, skipped: true });

  const referral = await prisma.referral.findUnique({ where: { code } });
  if (!referral) return NextResponse.json({ ok: true, skipped: true });

  // Don't let someone refer themselves
  if (referral.userId === userId) return NextResponse.json({ ok: true, skipped: true });

  try {
    await prisma.$transaction([
      prisma.referralUse.create({
        data: { referralId: referral.id, newUserId: userId },
      }),
      prisma.referral.update({
        where: { id: referral.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  } catch {
    // unique constraint — already credited, fine
  }

  return NextResponse.json({ ok: true });
}
