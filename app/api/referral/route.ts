import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let referral = await prisma.referral.findUnique({ where: { userId } });

  if (!referral) {
    // Retry on code collision (extremely unlikely but safe)
    for (let attempts = 0; attempts < 5; attempts++) {
      try {
        referral = await prisma.referral.create({
          data: { userId, code: generateCode() },
        });
        break;
      } catch {
        // unique constraint violation — try again
      }
    }
  }

  if (!referral) return NextResponse.json({ error: "Could not create referral" }, { status: 500 });

  return NextResponse.json({
    code: referral.code,
    usedCount: referral.usedCount,
  });
}
